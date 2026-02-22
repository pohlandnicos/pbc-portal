import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/server/org";
import { rateLimit } from "@/lib/security/rateLimit";
import { z } from "zod";

// GET /api/offers - Liste aller Angebote
export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`offers:list:${ip}`, { limit: 120, windowSeconds: 60 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { orgId } = await getCurrentOrgId();
  if (!orgId) return NextResponse.json({ error: "no_org" }, { status: 403 });

  const { data, error } = await supabase
    .from("offers")
    .select(`
      id,
      title,
      offer_number,
      offer_date,
      status,
      total_net,
      total_gross,
      customers (
        id,
        type,
        company_name,
        salutation,
        first_name,
        last_name
      ),
      projects (
        id,
        title
      )
    `)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ data });
}

// POST /api/offers - Neues Angebot erstellen
const createSchema = z.object({
  title: z.string().min(1),
  customer_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  offer_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  intro_salutation: z.string().optional(),
  intro_body_html: z.string().optional(),
  outro_body_html: z.string().optional()
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`offers:create:${ip}`, { limit: 60, windowSeconds: 60 });
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

  // 1. Angebot erstellen
  const { data: offer, error: offerError } = await supabase
    .from("offers")
    .insert({
      org_id: orgId,
      ...parsed.data,
      status: "draft"
    })
    .select()
    .single();

  if (offerError) return NextResponse.json({ error: "db_error" }, { status: 500 });

  // 2. Standard Templates laden und anwenden
  const { data: templates } = await supabase
    .from("offer_templates")
    .select()
    .eq("org_id", orgId)
    .eq("is_default", true);

  if (templates?.length) {
    const introTemplate = templates.find(t => t.type === "intro");
    const outroTemplate = templates.find(t => t.type === "outro");

    const { error: templateError } = await supabase
      .from("offers")
      .update({
        intro_salutation: introTemplate?.salutation,
        intro_body_html: introTemplate?.body_html,
        outro_body_html: outroTemplate?.body_html
      })
      .eq("id", offer.id);

    if (templateError) {
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }
  }

  // 3. Erste Leistungsgruppe erstellen
  const { error: groupError } = await supabase
    .from("offer_groups")
    .insert({
      org_id: orgId,
      offer_id: offer.id,
      index: 1,
      title: "Leistungen"
    });

  if (groupError) return NextResponse.json({ error: "db_error" }, { status: 500 });

  return NextResponse.json({ data: offer });
}
