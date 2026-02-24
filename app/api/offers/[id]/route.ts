import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/server/org";
import { rateLimit } from "@/lib/security/rateLimit";
import { z } from "zod";

// GET /api/offers/[id] - Angebot mit allen Details laden
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`offers:get:${ip}`, { limit: 120, windowSeconds: 60 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { orgId } = await getCurrentOrgId();
  if (!orgId) return NextResponse.json({ error: "no_org" }, { status: 403 });

  // Parallele Queries für Performance
  const [offerResult, groupsResult] = await Promise.all([
    // Hauptdaten
    supabase
      .from("offers")
      .select(`
        *,
        customers (
          id, type, company_name, salutation, first_name, last_name,
          billing_street, billing_house_number, billing_address_extra,
          billing_postal_code, billing_city
        ),
        projects (
          id, title,
          project_locations (
            street, house_number, address_extra, postal_code, city,
            is_billing_address
          )
        )
      `)
      .eq("id", id)
      .eq("org_id", orgId)
      .single(),

    // Gruppen mit Positionen
    supabase
      .from("offer_groups")
      .select(`
        *,
        offer_items (*)
      `)
      .eq("offer_id", id)
      .order("index")
  ]);

  if (offerResult.error || groupsResult.error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      ...offerResult.data,
      title: (offerResult.data as any)?.name,
      groups: groupsResult.data
    }
  });
}

// PATCH /api/offers/[id] - Angebot aktualisieren
const patchSchema = z.object({
  title: z.string().min(1).optional(),
  customer_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  offer_date: z.string().datetime().optional(),
  status: z.enum(["draft", "sent", "accepted", "rejected", "cancelled"]).optional(),
  intro_salutation: z.string().optional(),
  intro_body_html: z.string().optional(),
  outro_body_html: z.string().optional(),
  payment_due_days: z.number().int().min(0).optional(),
  discount_percent: z.number().min(0).max(100).optional(),
  discount_days: z.number().int().min(0).optional(),
  tax_rate: z.number().min(0).max(100).optional(),
  show_vat_for_labor: z.boolean().optional()
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`offers:update:${ip}`, { limit: 120, windowSeconds: 60 });
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

  const { title, ...rest } = parsed.data;
  const updateData = {
    ...rest,
    ...(title ? { name: title } : null)
  };

  const { data, error } = await supabase
    .from("offers")
    .update(updateData)
    .eq("id", id)
    .eq("org_id", orgId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ data });
}

// DELETE /api/offers/[id] - Angebot löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`offers:delete:${ip}`, { limit: 60, windowSeconds: 60 });
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
    .from("offers")
    .delete()
    .eq("id", id)
    .eq("org_id", orgId);

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
