import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/server/org";
import { rateLimit } from "@/lib/security/rateLimit";

const patchSchema = z
  .object({
    offer_prefix: z.string().min(1).max(16).optional(),
    offer_next_number: z.number().int().min(1).max(999999999).optional(),

    invoice_prefix: z.string().min(1).max(16).optional(),
    invoice_next_number: z.number().int().min(1).max(999999999).optional(),

    auto_customer_number: z.boolean().optional(),

    payment_due_days: z.number().int().min(1).max(3650).optional(),
    payment_scope: z.enum(["invoice", "both"]).optional(),

    labor_note_offer_private: z.boolean().optional(),
    labor_note_offer_business: z.boolean().optional(),
    labor_note_invoice_private: z.boolean().optional(),
    labor_note_invoice_business: z.boolean().optional(),
  })
  .strict();

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`settings:offer-invoice:get:${ip}`, { limit: 120, windowSeconds: 60 });
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
    .from("org_offer_invoice_settings")
    .select("*")
    .eq("org_id", orgId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  if (data) return NextResponse.json({ data });

  const { data: created, error: insertError } = await supabase
    .from("org_offer_invoice_settings")
    .insert({ org_id: orgId })
    .select("*")
    .single();

  if (insertError) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ data: created });
}

export async function PATCH(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`settings:offer-invoice:patch:${ip}`, { limit: 120, windowSeconds: 60 });
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
    .from("org_offer_invoice_settings")
    .upsert({ org_id: orgId, ...parsed.data }, { onConflict: "org_id" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ data });
}
