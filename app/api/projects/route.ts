import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/server/org";
import { rateLimit } from "@/lib/security/rateLimit";

const createProjectSchema = z
  .object({
    title: z.string().trim().min(1),
    received_at: z.string().trim().min(1),
    customer_id: z.string().uuid(),
    description: z.string().optional(),
    project_number: z.string().optional(),

    new_execution_location: z.boolean().optional(),
    execution_street: z.string().optional(),
    execution_house_number: z.string().optional(),
    execution_address_extra: z.string().optional(),
    execution_postal_code: z.string().optional(),
    execution_city: z.string().optional(),

    execution_phone_landline: z.string().optional(),
    execution_phone_mobile: z.string().optional(),
    execution_email: z.string().optional(),
  })
  .strict();

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`projects:list:${ip}`, { limit: 60, windowSeconds: 60 });
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

  const url = new URL(request.url);
  const customerId = url.searchParams.get("customer_id");
  if (customerId) {
    const parsedCustomerId = z.string().uuid().safeParse(customerId);
    if (!parsedCustomerId.success) {
      return NextResponse.json({ error: "invalid_customer_id" }, { status: 400 });
    }
  }

  let q = supabase
    .from("projects")
    .select(
      "id, title, project_number, received_at, created_at, customers(id, type, company_name, salutation, first_name, last_name), project_locations(city, street, house_number, postal_code, is_billing_address)"
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (customerId) {
    q = q.eq("customer_id", customerId);
  }

  const { data, error } = await q;

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  const mapped = (data ?? []).map((row: any) => {
    const customer = row.customers;
    const customerName = customer
      ? customer.type === "company"
        ? customer.company_name
        : `${customer.salutation ?? ""} ${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim()
      : "";

    const loc = Array.isArray(row.project_locations) ? row.project_locations[0] : null;
    const executionLocation = loc?.city ?? "";

    return {
      id: row.id,
      title: row.title,
      project_number: row.project_number,
      received_at: row.received_at,
      executionLocation,
      customerName,
    };
  });

  return NextResponse.json({ data: mapped });
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`projects:create:${ip}`, { limit: 20, windowSeconds: 60 });
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
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const newExecutionLocation = parsed.data.new_execution_location ?? false;

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select(
      "id, billing_street, billing_house_number, billing_address_extra, billing_postal_code, billing_city"
    )
    .eq("id", parsed.data.customer_id)
    .eq("org_id", orgId)
    .maybeSingle();

  if (customerError) return NextResponse.json({ error: "db_error" }, { status: 500 });
  if (!customer) return NextResponse.json({ error: "customer_not_found" }, { status: 404 });

  const insertProjectPayload = {
    org_id: orgId,
    customer_id: parsed.data.customer_id,
    title: parsed.data.title,
    received_at: parsed.data.received_at,
    description: parsed.data.description || null,
    project_number: parsed.data.project_number || null,
  };

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert(insertProjectPayload)
    .select("id")
    .single();

  if (projectError) {
    const message =
      typeof (projectError as any).message === "string" && (projectError as any).message.length > 0
        ? (projectError as any).message
        : "DB error";
    return NextResponse.json({ error: "db_error", message }, { status: 500 });
  }

  const street = newExecutionLocation
    ? parsed.data.execution_street
    : (customer as any).billing_street;
  const houseNumber = newExecutionLocation
    ? parsed.data.execution_house_number
    : (customer as any).billing_house_number;
  const addressExtra = newExecutionLocation
    ? parsed.data.execution_address_extra
    : (customer as any).billing_address_extra;
  const postalCode = newExecutionLocation
    ? parsed.data.execution_postal_code
    : (customer as any).billing_postal_code;
  const city = newExecutionLocation
    ? parsed.data.execution_city
    : (customer as any).billing_city;

  if (!street || !houseNumber || !postalCode || !city) {
    return NextResponse.json({ error: "missing_execution_address" }, { status: 400 });
  }

  const locationPayload = {
    org_id: orgId,
    project_id: project.id,
    is_billing_address: !newExecutionLocation,
    street,
    house_number: houseNumber,
    address_extra: addressExtra || null,
    postal_code: postalCode,
    city,
    contact_name: null,
    phone_landline: parsed.data.execution_phone_landline || null,
    phone_mobile: parsed.data.execution_phone_mobile || null,
    email: parsed.data.execution_email || null,
  };

  const { error: locError } = await supabase
    .from("project_locations")
    .insert(locationPayload)
    .select("id")
    .single();

  if (locError) {
    const message =
      typeof (locError as any).message === "string" && (locError as any).message.length > 0
        ? (locError as any).message
        : "DB error";
    return NextResponse.json({ error: "db_error", message }, { status: 500 });
  }

  return NextResponse.json({ data: { id: project.id } }, { status: 201 });
}
