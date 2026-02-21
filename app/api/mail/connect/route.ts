import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { rateLimit } from "@/lib/security/rateLimit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/server/org";

const SCOPES = ["offline_access", "openid", "profile", "email", "Mail.Read"].join(
  " "
);

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`mail:connect:${ip}`, { limit: 10, windowSeconds: 60 });
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

  const tenantId = process.env.MICROSOFT_ENTRA_TENANT_ID;
  const clientId = process.env.MICROSOFT_ENTRA_CLIENT_ID;
  const redirectUri = process.env.MICROSOFT_ENTRA_REDIRECT_URI;

  if (!tenantId || !clientId || !redirectUri) {
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  const state = crypto.randomBytes(32).toString("base64url");
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  const authorizeUrl = new URL(
    `https://login.microsoftonline.com/${encodeURIComponent(
      tenantId
    )}/oauth2/v2.0/authorize`
  );

  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_mode", "query");
  authorizeUrl.searchParams.set("scope", SCOPES);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.json({ url: authorizeUrl.toString() });
  const isProd = process.env.NODE_ENV === "production";

  response.cookies.set("pbc_mail_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 10 * 60,
  });

  response.cookies.set("pbc_mail_oauth_verifier", verifier, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 10 * 60,
  });

  return response;
}
