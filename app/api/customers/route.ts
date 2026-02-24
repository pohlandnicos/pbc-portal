import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import type { Database } from "@/types/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/server/org";
import { rateLimit } from "@/lib/security/rateLimit";

type Customer = Database["public"]["Tables"]["customers"]["Row"];

const createCustomerSchema = z
  .object({
    type: z.enum(["private", "company"]),

    company_name: z.string().optional(),
    salutation: z.string().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),

    description: z.string().optional(),
    customer_number: z.string().optional(),
    leitweg_id: z.string().optional(),
    supplier_number: z.string().optional(),
    vat_id: z.string().optional(),
    vendor_number: z.string().optional(),

    billing_street: z.string().trim().min(1),
    billing_house_number: z.string().trim().min(1),
    billing_address_extra: z.string().optional(),
    billing_postal_code: z.string().trim().min(1),
    billing_city: z.string().trim().min(1),
  })
  .strict();

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
      "id, company_name, salutation, first_name, last_name, type, billing_street, billing_house_number, billing_postal_code, billing_city"
    )
    .eq("org_id", orgId)
    .order("company_name", { nullsFirst: true })
    .order("last_name", { nullsFirst: true });

  if (error) {
    const message =
      typeof (error as any).message === "string" && (error as any).message.length > 0
        ? (error as any).message
        : "DB error";
    return NextResponse.json({ error: "db_error", message }, { status: 500 });
  }

  const customers = (data as Customer[]).map((c) => ({
    id: c.id,
    name:
      c.type === "company"
        ? c.company_name
        : `${c.salutation ?? ""} ${c.first_name ?? ""} ${c.last_name ?? ""}`.trim(),
    street: `${c.billing_street ?? ""} ${c.billing_house_number ?? ""}`.trim(),
    zip: c.billing_postal_code ?? "",
    city: c.billing_city ?? "",
  }));

  return NextResponse.json({ data: customers });
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

  const insertPayload: Database["public"]["Tables"]["customers"]["Insert"] = {
    org_id: orgId,
    type: parsed.data.type,
    company_name: parsed.data.type === "company" ? parsed.data.company_name?.trim() || null : null,
    salutation: parsed.data.type === "private" ? parsed.data.salutation?.trim() || null : null,
    first_name: parsed.data.type === "private" ? parsed.data.first_name?.trim() || null : null,
    last_name: parsed.data.type === "private" ? parsed.data.last_name?.trim() || null : null,
    description: parsed.data.description?.trim() || null,
    customer_number: parsed.data.customer_number?.trim() || null,
    leitweg_id: parsed.data.type === "company" ? parsed.data.leitweg_id?.trim() || null : null,
    supplier_number: parsed.data.supplier_number?.trim() || null,
    vat_id: parsed.data.vat_id?.trim() || null,
    vendor_number: parsed.data.vendor_number?.trim() || null,
    billing_street: parsed.data.billing_street,
    billing_house_number: parsed.data.billing_house_number,
    billing_address_extra: parsed.data.billing_address_extra?.trim() || null,
    billing_postal_code: parsed.data.billing_postal_code,
    billing_city: parsed.data.billing_city,
  };

  const { data, error } = await supabase
    .from("customers")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) {
    const message =
      typeof (error as any).message === "string" && (error as any).message.length > 0
        ? (error as any).message
        : "DB error";
    return NextResponse.json({ error: "db_error", message }, { status: 500 });
  }

  return NextResponse.json({ data: { id: data?.id } }, { status: 201 });
}
