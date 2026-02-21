import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/server/org";
import { rateLimit } from "@/lib/security/rateLimit";
import { z } from "zod";

const patchSchema = z
  .object({
    status: z.enum([
      "open",
      "in_progress",
      "done",
      "cancelled",
      "new_project",
      "appointment_planned",
      "appointment_documented",
      "offer_created",
      "offer_accepted",
      "invoice_created",
      "invoice_overdue",
      "invoice_reminded",
      "invoice_paid",
    ]),
  })
  .strict();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`projects:get:${ip}`, { limit: 120, windowSeconds: 60 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { orgId } = await getCurrentOrgId();
  if (!orgId) return NextResponse.json({ error: "no_org" }, { status: 403 });

  const { data, error } = await supabase
    .from("projects")
    .select(
      "*, customers(id, type, company_name, salutation, first_name, last_name, billing_street, billing_house_number, billing_address_extra, billing_postal_code, billing_city), project_locations(*)"
    )
    .eq("id", id)
    .eq("org_id", orgId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const loc = Array.isArray((data as any).project_locations)
    ? (data as any).project_locations[0]
    : null;

  return NextResponse.json({
    data: {
      ...data,
      customer: (data as any).customers ?? null,
      execution_location: loc ?? null,
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`projects:update:${ip}`, { limit: 60, windowSeconds: 60 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { orgId } = await getCurrentOrgId();
  if (!orgId) return NextResponse.json({ error: "no_org" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("projects")
    .update({ status: parsed.data.status })
    .eq("id", id)
    .eq("org_id", orgId)
    .select("id, status")
    .maybeSingle();

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ data }, { status: 200 });
}
