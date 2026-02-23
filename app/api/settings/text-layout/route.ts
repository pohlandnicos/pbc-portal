import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/server/org";
import { rateLimit } from "@/lib/security/rateLimit";

const patchSchema = z
  .object({
    logo_enabled: z.boolean().optional(),
    logo_position: z.enum(["left", "right"]).optional(),
    logo_size: z.enum(["small", "medium", "large"]).optional(),
    sender_line_enabled: z.boolean().optional(),
    footer_enabled: z.boolean().optional(),

    retention_note_private: z.boolean().optional(),
    footer_mode: z.enum(["standard", "custom"]).optional(),
    footer_custom_html: z.string().nullable().optional(),

    company_name: z.string().nullable().optional(),
    street: z.string().nullable().optional(),
    house_number: z.string().nullable().optional(),
    address_extra: z.string().nullable().optional(),
    postal_code: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    tax_number: z.string().nullable().optional(),
    vat_id: z.string().nullable().optional(),

    bank_account_holder: z.string().nullable().optional(),
    iban: z.string().nullable().optional(),
    bic: z.string().nullable().optional(),
    bank_name: z.string().nullable().optional(),

    website: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    mobile: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),

    legal_form: z.string().nullable().optional(),
    owner_name: z.string().nullable().optional(),
    register_court: z.string().nullable().optional(),
    hbr_number: z.string().nullable().optional(),
  })
  .strict();

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`settings:text-layout:get:${ip}`, { limit: 120, windowSeconds: 60 });
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
    .from("org_text_layout_settings")
    .select("*")
    .eq("org_id", orgId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  let row = data;
  if (!row) {
    const { data: created, error: insertError } = await supabase
      .from("org_text_layout_settings")
      .insert({ org_id: orgId })
      .select("*")
      .single();

    if (insertError) return NextResponse.json({ error: "db_error" }, { status: 500 });
    row = created;
  }

  let logo_url: string | null = null;
  if (row?.logo_path) {
    const { data: signed } = await supabase
      .storage
      .from("org-docs")
      .createSignedUrl(row.logo_path, 60 * 60);

    logo_url = signed?.signedUrl ?? null;
  }

  return NextResponse.json({ data: { ...row, logo_url } });
}

export async function PATCH(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`settings:text-layout:patch:${ip}`, { limit: 120, windowSeconds: 60 });
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

  const { data, error } = await supabase
    .from("org_text_layout_settings")
    .upsert({ org_id: orgId, ...parsed.data }, { onConflict: "org_id" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ data });
}
