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
      name:title,
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
  outro_body_html: z.string().optional(),
  payment_due_days: z.number().int().min(0).optional(),
  discount_percent: z.number().min(0).max(100).optional(),
  discount_days: z.number().int().min(0).optional(),
  tax_rate: z.number().min(0).max(100).optional(),
  show_vat_for_labor: z.boolean().optional()
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
  console.log('Request body:', body);

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    console.log('Validation error:', parsed.error);
    return NextResponse.json({ error: "invalid_input", details: parsed.error }, { status: 400 });
  }

  // 1. Angebot erstellen
  console.log('Creating offer with data:', {
    org_id: orgId,
    ...parsed.data,
    status: "draft"
  });

  const { title, ...rest } = parsed.data;

  async function getNextOfferNumber() {
    const { data: settings, error: settingsError } = await supabase
      .from("org_offer_invoice_settings")
      .select("offer_prefix, offer_next_number")
      .eq("org_id", orgId)
      .maybeSingle();

    if (settingsError) {
      return { offer_number: null as string | null, next_number: null as number | null };
    }

    const offerPrefix = (settings?.offer_prefix ?? "A-").trim();
    const next = settings?.offer_next_number ?? 1;
    const offer_number = `${offerPrefix}${next}`;
    return { offer_number, next_number: next };
  }

  async function bumpOfferNextNumber(next: number) {
    await supabase
      .from("org_offer_invoice_settings")
      .upsert(
        { org_id: orgId, offer_next_number: next + 1 },
        { onConflict: "org_id" }
      );
  }

  let offerNumber: string | null = null;
  let nextNumber: number | null = null;
  const nextResult = await getNextOfferNumber();
  offerNumber = nextResult.offer_number;
  nextNumber = nextResult.next_number;

  const baseInsert = {
    org_id: orgId,
    ...rest,
    name: title,
    status: "draft",
    ...(offerNumber ? { offer_number: offerNumber } : null)
  };

  let offerInsertResult = await supabase
    .from("offers")
    .insert(baseInsert)
    .select()
    .single();

  // Falls es zu einem Unique-Conflict kommt, einmal neu versuchen
  if (offerInsertResult.error && offerInsertResult.error.code === "23505") {
    const retryNext = await getNextOfferNumber();
    offerNumber = retryNext.offer_number;
    nextNumber = retryNext.next_number;
    offerInsertResult = await supabase
      .from("offers")
      .insert({ ...baseInsert, ...(offerNumber ? { offer_number: offerNumber } : null) })
      .select()
      .single();
  }

  const { data: offer, error: offerError } = offerInsertResult;

  if (offerError) {
    console.error('Database error:', offerError);
    return NextResponse.json(
      { error: "db_error", message: offerError.message, details: offerError },
      { status: 500 }
    );
  }

  if (typeof nextNumber === "number") {
    await bumpOfferNextNumber(nextNumber);
  }

  // 2. Standard Templates laden und anwenden
  const { data: templates } = await supabase
    .from("offer_templates")
    .select()
    .eq("org_id", orgId)
    .eq("is_default", true);

  if (templates?.length) {
    const introTemplate = templates.find(t => t.type === "intro");
    const outroTemplate = templates.find(t => t.type === "outro");

    const templateUpdate: Record<string, unknown> = {};
    if (!parsed.data.intro_salutation && introTemplate?.salutation) {
      templateUpdate.intro_salutation = introTemplate.salutation;
    }
    if (!parsed.data.intro_body_html && introTemplate?.body_html) {
      templateUpdate.intro_body_html = introTemplate.body_html;
    }
    if (!parsed.data.outro_body_html && outroTemplate?.body_html) {
      templateUpdate.outro_body_html = outroTemplate.body_html;
    }

    if (Object.keys(templateUpdate).length === 0) {
      return NextResponse.json({ data: offer });
    }

    const { error: templateError } = await supabase
      .from("offers")
      .update({
        ...templateUpdate
      })
      .eq("id", offer.id);

    if (templateError) {
      return NextResponse.json(
        { error: "db_error", message: templateError.message, details: templateError },
        { status: 500 }
      );
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

  if (groupError) {
    return NextResponse.json(
      { error: "db_error", message: groupError.message, details: groupError },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: offer });
}
