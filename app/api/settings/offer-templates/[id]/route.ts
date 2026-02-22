import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/server/org";
import { rateLimit } from "@/lib/security/rateLimit";
import { z } from "zod";

// PATCH /api/settings/offer-templates/[id] - Template aktualisieren
const patchSchema = z.object({
  name: z.string().min(1).optional(),
  salutation: z.string().optional(),
  body_html: z.string().optional(),
  is_default: z.boolean().optional()
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`templates:update:${ip}`, { limit: 120, windowSeconds: 60 });
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

  // Wenn is_default, altes Default Template updaten
  if (parsed.data.is_default) {
    const { data: current } = await supabase
      .from("offer_templates")
      .select("type")
      .eq("id", params.id)
      .single();

    if (current) {
      await supabase
        .from("offer_templates")
        .update({ is_default: false })
        .eq("org_id", orgId)
        .eq("type", current.type)
        .eq("is_default", true);
    }
  }

  const { data, error } = await supabase
    .from("offer_templates")
    .update(parsed.data)
    .eq("id", params.id)
    .eq("org_id", orgId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ data });
}

// DELETE /api/settings/offer-templates/[id] - Template löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`templates:delete:${ip}`, { limit: 60, windowSeconds: 60 });
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
    .from("offer_templates")
    .delete()
    .eq("id", params.id)
    .eq("org_id", orgId);

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
