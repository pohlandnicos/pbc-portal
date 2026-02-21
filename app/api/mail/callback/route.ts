import { NextResponse, type NextRequest } from "next/server";
import { rateLimit } from "@/lib/security/rateLimit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { encryptJson } from "@/lib/crypto/encryption";
import { getCurrentOrgId } from "@/lib/server/org";

type TokenResponse = {
  token_type: string;
  scope: string;
  expires_in: number;
  ext_expires_in?: number;
  access_token: string;
  refresh_token?: string;
  id_token?: string;
};

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`mail:callback:${ip}`, { limit: 30, windowSeconds: 60 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(new URL("/app/settings", url.origin));
  }

  const expectedState = request.cookies.get("pbc_mail_oauth_state")?.value;
  const verifier = request.cookies.get("pbc_mail_oauth_verifier")?.value;
  const isProd = process.env.NODE_ENV === "production";

  if (!expectedState || expectedState !== state || !verifier) {
    return NextResponse.redirect(new URL("/app/settings", url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const { orgId } = await getCurrentOrgId();
  if (!orgId) {
    return NextResponse.redirect(new URL("/app/settings", url.origin));
  }

  const tenantId = process.env.MICROSOFT_ENTRA_TENANT_ID;
  const clientId = process.env.MICROSOFT_ENTRA_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_ENTRA_CLIENT_SECRET;
  const redirectUri = process.env.MICROSOFT_ENTRA_REDIRECT_URI;

  if (!tenantId || !clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(new URL("/app/settings", url.origin));
  }

  const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(
    tenantId
  )}/oauth2/v2.0/token`;

  const body = new URLSearchParams();
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);
  body.set("grant_type", "authorization_code");
  body.set("code", code);
  body.set("redirect_uri", redirectUri);
  body.set("code_verifier", verifier);

  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/app/settings", url.origin));
  }

  const tokens = (await tokenRes.json()) as TokenResponse;

  const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  const accessCipher = encryptJson({ token: tokens.access_token });
  const refreshCipher = tokens.refresh_token
    ? encryptJson({ token: tokens.refresh_token })
    : null;

  const ownerUserId = user.id;

  const { error } = await supabase.from("mail_accounts").insert({
    org_id: orgId,
    provider: "microsoft",
    owner_user_id: ownerUserId,
    tenant_id: tenantId,
    access_token_ciphertext: accessCipher,
    refresh_token_ciphertext: refreshCipher,
    token_expires_at: tokenExpiresAt.toISOString(),
  });

  const response = NextResponse.redirect(new URL("/app/settings", url.origin));

  response.cookies.set("pbc_mail_oauth_state", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 0,
  });
  response.cookies.set("pbc_mail_oauth_verifier", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 0,
  });

  if (error) {
    return response;
  }

  return response;
}
