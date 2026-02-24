import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/server/org";
import { rateLimit } from "@/lib/security/rateLimit";

const patchSchema = z
  .object({
    first_name: z.string().min(0).max(100).nullable().optional(),
    last_name: z.string().min(0).max(100).nullable().optional(),
  })
  .strict();

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`settings:account:get:${ip}`, { limit: 120, windowSeconds: 60 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const { orgId } = await getCurrentOrgId();
  if (!orgId) return NextResponse.json({ error: "no_org" }, { status: 403 });

  const { data, error } = await supabase
    .from("user_profiles")
    .select("first_name,last_name,avatar_path")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  let row = data;
  if (!row) {
    const { data: created, error: insertError } = await supabase
      .from("user_profiles")
      .insert({ org_id: orgId, user_id: user.id })
      .select("first_name,last_name,avatar_path")
      .single();

    if (insertError) return NextResponse.json({ error: "db_error" }, { status: 500 });
    row = created;
  }

  let avatar_url: string | null = null;
  if (row?.avatar_path) {
    const { data: signed } = await supabase
      .storage
      .from("org-docs")
      .createSignedUrl(row.avatar_path, 60 * 60);
    avatar_url = signed?.signedUrl ?? null;
  }

  return NextResponse.json({
    data: {
      first_name: row?.first_name ?? null,
      last_name: row?.last_name ?? null,
      username: user.email ?? user.id,
      email: user.email ?? null,
      email_confirmed_at: user.email_confirmed_at ?? null,
      avatar_url,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`settings:account:patch:${ip}`, { limit: 120, windowSeconds: 60 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const { orgId } = await getCurrentOrgId();
  if (!orgId) return NextResponse.json({ error: "no_org" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const { data, error } = await supabase
    .from("user_profiles")
    .upsert(
      {
        org_id: orgId,
        user_id: user.id,
        ...parsed.data,
      },
      { onConflict: "org_id,user_id" }
    )
    .select("first_name,last_name,avatar_path")
    .single();

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ data });
}
