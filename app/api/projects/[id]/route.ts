import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/server/org";
import { rateLimit } from "@/lib/security/rateLimit";

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
