import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/server/org";
import { rateLimit } from "@/lib/security/rateLimit";
import { z } from "zod";

// POST /api/offers/[id]/groups/[groupId]/items - Neue Position erstellen
const createSchema = z.object({
  type: z.enum(["material", "labor", "other"]),
  name: z.string().min(1),
  description: z.string().optional(),
  qty: z.number().min(0),
  unit: z.string(),
  purchase_price: z.number().min(0),
  markup_percent: z.number().min(0)
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  const { id, groupId } = await params;
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`offers:items:create:${ip}`, { limit: 60, windowSeconds: 60 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { orgId } = await getCurrentOrgId();
  if (!orgId) return NextResponse.json({ error: "no_org" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  // 1. Position Index ermitteln (1.1, 1.2, etc.)
  const { data: group } = await supabase
    .from("offer_groups")
    .select("index")
    .eq("id", groupId)
    .single();

  if (!group) return NextResponse.json({ error: "group_not_found" }, { status: 404 });

  const { data: lastItem } = await supabase
    .from("offer_items")
    .select("position_index")
    .eq("offer_group_id", groupId)
    .order("position_index", { ascending: false })
    .limit(1)
    .single();

  const lastSubIndex = lastItem
    ? parseInt(lastItem.position_index.split(".")[1], 10)
    : 0;

  const positionIndex = `${group.index}.${lastSubIndex + 1}`;

  // 2. Preise berechnen
  const { qty, purchase_price, markup_percent } = parsed.data;
  const unit_price = purchase_price * (1 + markup_percent / 100);
  const margin_amount = unit_price - purchase_price;
  const line_total = qty * unit_price;

  // 3. Position erstellen
  const { data: item, error: itemError } = await supabase
    .from("offer_items")
    .insert({
      org_id: orgId,
      offer_group_id: groupId,
      position_index: positionIndex,
      ...parsed.data,
      unit_price,
      margin_amount,
      line_total
    })
    .select()
    .single();

  if (itemError) return NextResponse.json({ error: "db_error" }, { status: 500 });

  // 4. Gruppensummen aktualisieren
  const { data: items } = await supabase
    .from("offer_items")
    .select("type, purchase_price, margin_amount, line_total")
    .eq("offer_group_id", groupId);

  if (!items) return NextResponse.json({ error: "db_error" }, { status: 500 });

  const totals = items.reduce(
    (acc, item) => {
      const cost = item.purchase_price;
      const margin = item.margin_amount;

      switch (item.type) {
        case "material":
          acc.material_cost += cost;
          acc.material_margin += margin;
          break;
        case "labor":
          acc.labor_cost += cost;
          acc.labor_margin += margin;
          break;
        case "other":
          acc.other_cost += cost;
          acc.other_margin += margin;
          break;
      }

      acc.total_net += item.line_total;
      return acc;
    },
    {
      material_cost: 0,
      labor_cost: 0,
      other_cost: 0,
      material_margin: 0,
      labor_margin: 0,
      other_margin: 0,
      total_net: 0
    }
  );

  const { error: updateError } = await supabase
    .from("offer_groups")
    .update(totals)
    .eq("id", groupId);

  if (updateError) return NextResponse.json({ error: "db_error" }, { status: 500 });

  return NextResponse.json({ data: item });
}
