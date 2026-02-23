import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/server/org";
import { rateLimit } from "@/lib/security/rateLimit";
import { z } from "zod";

// GET /api/settings/offer-templates - Templates laden
export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`templates:list:${ip}`, { limit: 120, windowSeconds: 60 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { orgId } = await getCurrentOrgId();
  if (!orgId) return NextResponse.json({ error: "no_org" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const docType = searchParams.get("doc_type");

  let q = supabase.from("offer_templates").select().eq("org_id", orgId);
  if (docType === "offer" || docType === "invoice") {
    q = q.eq("doc_type", docType);
  }

  const { data, error } = await q.order("name");

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ data });
}

// POST /api/settings/offer-templates - Template erstellen
const createSchema = z.object({
  doc_type: z.enum(["offer", "invoice"]).optional(),
  type: z.enum(["intro", "outro"]),
  name: z.string().min(1),
  salutation: z.string().optional(),
  body_html: z.string(),
  is_default: z.boolean().optional()
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`templates:create:${ip}`, { limit: 60, windowSeconds: 60 });
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
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  // Wenn is_default, altes Default Template updaten
  if (parsed.data.is_default) {
    await supabase
      .from("offer_templates")
      .update({ is_default: false })
      .eq("org_id", orgId)
      .eq("doc_type", parsed.data.doc_type ?? "offer")
      .eq("type", parsed.data.type)
      .eq("is_default", true);
  }

  const { data, error } = await supabase
    .from("offer_templates")
    .insert({
      org_id: orgId,
      doc_type: parsed.data.doc_type ?? "offer",
      ...parsed.data,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ data });
}
