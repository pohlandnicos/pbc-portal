import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/server/org";
import { rateLimit } from "@/lib/security/rateLimit";

const createCustomerSchema = z.object({
  type: z.enum(["private", "company"]),
  company_name: z.string().trim().min(1).optional(),
  salutation: z.string().trim().min(1).optional(),
  first_name: z.string().trim().min(1).optional(),
  last_name: z.string().trim().min(1).optional(),

  description: z.string().optional(),
  customer_number: z.string().optional(),
  leitweg_id: z.string().optional(),
  supplier_number: z.string().optional(),
  vendor_number: z.string().optional(),
  vat_id: z.string().optional(),

  billing_street: z.string().trim().min(1),
  billing_house_number: z.string().trim().min(1),
  billing_address_extra: z.string().optional(),
  billing_postal_code: z.string().trim().min(1),
  billing_city: z.string().trim().min(1),
});

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`customers:list:${ip}`, { limit: 60, windowSeconds: 60 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { orgId } = await getCurrentOrgId();
  if (!orgId) return NextResponse.json({ error: "no_org" }, { status: 403 });

  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, type, company_name, salutation, first_name, last_name, customer_number, billing_address_extra, billing_city, created_at, projects(count)"
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  const mapped = (data ?? []).map((row: any) => {
    const projectsCount = Array.isArray(row.projects) ? row.projects[0]?.count ?? 0 : 0;
    const { projects, ...rest } = row;
    return { ...rest, projectsCount };
  });

  return NextResponse.json({ data: mapped });
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`customers:create:${ip}`, { limit: 20, windowSeconds: 60 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { orgId } = await getCurrentOrgId();
  if (!orgId) return NextResponse.json({ error: "no_org" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = createCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const insertPayload = { ...parsed.data, org_id: orgId };

  const { data, error } = await supabase
    .from("customers")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
