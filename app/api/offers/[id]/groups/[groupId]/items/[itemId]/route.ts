import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/server/org";
import { rateLimit } from "@/lib/security/rateLimit";
import { z } from "zod";

// PATCH /api/offers/[id]/groups/[groupId]/items/[itemId] - Position aktualisieren
const patchSchema = z.object({
  type: z.enum(["material", "labor", "other"]).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  qty: z.number().min(0).optional(),
  unit: z.string().optional(),
  purchase_price: z.number().min(0).optional(),
  markup_percent: z.number().min(0).optional(),
  margin_amount: z.number().min(0).optional()
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; groupId: string; itemId: string } }
) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`offers:items:update:${ip}`, { limit: 120, windowSeconds: 60 });
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
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  // 1. Aktuelle Position laden
  const { data: current } = await supabase
    .from("offer_items")
    .select()
    .eq("id", params.itemId)
    .single();

  if (!current) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // 2. Preise neu berechnen
  const qty = parsed.data.qty ?? current.qty;
  const purchase_price = parsed.data.purchase_price ?? current.purchase_price;
  
  // Wenn margin_amount gesetzt, daraus markup_percent berechnen
  let markup_percent = parsed.data.markup_percent;
  let margin_amount = parsed.data.margin_amount;
  
  if (margin_amount !== undefined) {
    markup_percent = ((purchase_price + margin_amount) / purchase_price - 1) * 100;
  } else if (markup_percent !== undefined) {
    margin_amount = purchase_price * (markup_percent / 100);
  } else {
    markup_percent = current.markup_percent;
    margin_amount = current.margin_amount;
  }

  const unit_price = purchase_price + margin_amount;
  const line_total = qty * unit_price;

  // 3. Position aktualisieren
  const { data: item, error: itemError } = await supabase
    .from("offer_items")
    .update({
      ...parsed.data,
      qty,
      purchase_price,
      markup_percent,
      margin_amount,
      unit_price,
      line_total
    })
    .eq("id", params.itemId)
    .eq("offer_group_id", params.groupId)
    .eq("org_id", orgId)
    .select()
    .single();

  if (itemError) return NextResponse.json({ error: "db_error" }, { status: 500 });

  // 4. Gruppensummen aktualisieren
  const { data: items } = await supabase
    .from("offer_items")
    .select("type, purchase_price, margin_amount, line_total")
    .eq("offer_group_id", params.groupId);

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
    .eq("id", params.groupId);

  if (updateError) return NextResponse.json({ error: "db_error" }, { status: 500 });

  return NextResponse.json({ data: item });
}

// DELETE /api/offers/[id]/groups/[groupId]/items/[itemId] - Position löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; groupId: string; itemId: string } }
) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`offers:items:delete:${ip}`, { limit: 60, windowSeconds: 60 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { orgId } = await getCurrentOrgId();
  if (!orgId) return NextResponse.json({ error: "no_org" }, { status: 403 });

  const { error } = await supabase
    .from("offer_items")
    .delete()
    .eq("id", params.itemId)
    .eq("offer_group_id", params.groupId)
    .eq("org_id", orgId);

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  // Gruppensummen aktualisieren
  const { data: items } = await supabase
    .from("offer_items")
    .select("type, purchase_price, margin_amount, line_total")
    .eq("offer_group_id", params.groupId);

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
    .eq("id", params.groupId);

  if (updateError) return NextResponse.json({ error: "db_error" }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
