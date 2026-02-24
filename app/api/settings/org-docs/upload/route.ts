import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/server/org";
import { rateLimit } from "@/lib/security/rateLimit";

const MAX_PDF_BYTES = 1_000_000;
const MAX_LOGO_BYTES = 1_000_000;
const MAX_AVATAR_BYTES = 1_000_000;

type UploadKind = "agb" | "withdrawal" | "logo" | "avatar";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`settings:org-docs:upload:${ip}`, { limit: 60, windowSeconds: 60 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { orgId } = await getCurrentOrgId();
  if (!orgId) return NextResponse.json({ error: "no_org" }, { status: 403 });

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "invalid_form" }, { status: 400 });

  const kind = (form.get("kind") ?? "") as UploadKind;
  const file = form.get("file");

  if (!kind || !["agb", "withdrawal", "logo", "avatar"].includes(kind)) {
    return NextResponse.json({ error: "invalid_kind" }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  if (kind !== "logo" && kind !== "avatar") {
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "invalid_file_type" }, { status: 400 });
    }
    if (file.size > MAX_PDF_BYTES) {
      return NextResponse.json({ error: "file_too_large" }, { status: 400 });
    }
  } else {
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "invalid_file_type" }, { status: 400 });
    }
    if (kind === "logo" && file.size > MAX_LOGO_BYTES) {
      return NextResponse.json({ error: "file_too_large" }, { status: 400 });
    }
    if (kind === "avatar" && file.size > MAX_AVATAR_BYTES) {
      return NextResponse.json({ error: "file_too_large" }, { status: 400 });
    }
  }

  const ext = kind === "logo" || kind === "avatar" ? (file.name.split(".").pop() || "png") : "pdf";
  const safeExt = ext.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const filename =
    kind === "logo"
      ? `logo.${safeExt || "png"}`
      : kind === "avatar"
        ? `avatars/${Date.now()}.${safeExt || "png"}`
        : `${kind}.pdf`;
  const path = `${orgId}/${filename}`;

  const { error: uploadError } = await supabase
    .storage
    .from("org-docs")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: "upload_error" }, { status: 500 });
  }

  if (kind === "logo") {
    const { error: dbError } = await supabase
      .from("org_text_layout_settings")
      .upsert({ org_id: orgId, logo_path: path }, { onConflict: "org_id" });

    if (dbError) return NextResponse.json({ error: "db_error" }, { status: 500 });
  } else if (kind === "avatar") {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

    const { error: dbError } = await supabase
      .from("user_profiles")
      .upsert({ org_id: orgId, user_id: user.id, avatar_path: path }, { onConflict: "org_id,user_id" });

    if (dbError) return NextResponse.json({ error: "db_error" }, { status: 500 });
  } else {
    const patch = kind === "agb" ? { agb_pdf_path: path } : { withdrawal_pdf_path: path };
    const { error: dbError } = await supabase
      .from("org_offer_invoice_settings")
      .upsert({ org_id: orgId, ...patch }, { onConflict: "org_id" });

    if (dbError) return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ data: { path } });
}
