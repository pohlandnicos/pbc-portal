import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/server/org";
import { rateLimit } from "@/lib/security/rateLimit";

const schema = z
  .object({
    customer_id: z.string().uuid(),
    contact_name: z.string().optional(),
    phone_landline: z.string().optional(),
    phone_mobile: z.string().optional(),
    email: z.string().email().optional(),
  })
  .strict();

const patchSchema = z
  .object({
    id: z.string().uuid(),
    contact_name: z.string().nullable().optional(),
    phone_landline: z.string().nullable().optional(),
    phone_mobile: z.string().nullable().optional(),
    email: z.string().email().nullable().optional(),
  })
  .strict();

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`customer-contacts:list:${ip}`, { limit: 120, windowSeconds: 60 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const url = new URL(request.url);
  const customerId = url.searchParams.get("customer_id");
  if (!customerId) {
    return NextResponse.json({ error: "missing_customer_id" }, { status: 400 });
  }

  const parsedCustomerId = z.string().uuid().safeParse(customerId);
  if (!parsedCustomerId.success) {
    return NextResponse.json({ error: "invalid_customer_id" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { orgId } = await getCurrentOrgId();
  if (!orgId) return NextResponse.json({ error: "no_org" }, { status: 403 });

  const { data, error } = await supabase
    .from("customer_contacts")
    .select("id, contact_name, phone_landline, phone_mobile, email, created_at")
    .eq("org_id", orgId)
    .eq("customer_id", parsedCustomerId.data)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`customer-contacts:create:${ip}`, { limit: 30, windowSeconds: 60 });
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
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("id", parsed.data.customer_id)
    .eq("org_id", orgId)
    .maybeSingle();

  if (customerError) return NextResponse.json({ error: "db_error" }, { status: 500 });
  if (!customer) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const insertPayload = {
    org_id: orgId,
    customer_id: parsed.data.customer_id,
    contact_name: parsed.data.contact_name || null,
    phone_landline: parsed.data.phone_landline || null,
    phone_mobile: parsed.data.phone_mobile || null,
    email: parsed.data.email || null,
  };

  const { data, error } = await supabase
    .from("customer_contacts")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`customer-contacts:update:${ip}`, { limit: 60, windowSeconds: 60 });
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
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {};
  if (parsed.data.contact_name !== undefined) updatePayload.contact_name = parsed.data.contact_name;
  if (parsed.data.phone_landline !== undefined) updatePayload.phone_landline = parsed.data.phone_landline;
  if (parsed.data.phone_mobile !== undefined) updatePayload.phone_mobile = parsed.data.phone_mobile;
  if (parsed.data.email !== undefined) updatePayload.email = parsed.data.email;

  const { data, error } = await supabase
    .from("customer_contacts")
    .update(updatePayload)
    .eq("id", parsed.data.id)
    .eq("org_id", orgId)
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ data }, { status: 200 });
}
