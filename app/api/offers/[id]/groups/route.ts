import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/server/org";
import { rateLimit } from "@/lib/security/rateLimit";
import { z } from "zod";

// POST /api/offers/[id]/groups - Neue Gruppe erstellen
const createSchema = z.object({
  title: z.string().min(1)
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`offers:groups:create:${ip}`, { limit: 60, windowSeconds: 60 });
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

  // 1. Nächsten Index ermitteln
  const { data: lastGroup } = await supabase
    .from("offer_groups")
    .select("index")
    .eq("offer_id", params.id)
    .order("index", { ascending: false })
    .limit(1)
    .single();

  const nextIndex = (lastGroup?.index ?? 0) + 1;

  // 2. Gruppe erstellen
  const { data, error } = await supabase
    .from("offer_groups")
    .insert({
      org_id: orgId,
      offer_id: params.id,
      index: nextIndex,
      title: parsed.data.title
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ data });
}
