import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/security/rateLimit";

const schema = z
  .object({
    lat: z.coerce.number().finite(),
    lon: z.coerce.number().finite(),
    zoom: z.coerce.number().int().min(1).max(19).default(15),
    w: z.coerce.number().int().min(200).max(1200).default(600),
    h: z.coerce.number().int().min(200).max(1200).default(240),
  })
  .strict();

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`static-map:${ip}`, { limit: 120, windowSeconds: 60 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const url = new URL(request.url);
  const parsed = schema.safeParse({
    lat: url.searchParams.get("lat"),
    lon: url.searchParams.get("lon"),
    zoom: url.searchParams.get("zoom") ?? undefined,
    w: url.searchParams.get("w") ?? undefined,
    h: url.searchParams.get("h") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }

  const { lat, lon, zoom, w, h } = parsed.data;

  const upstreamUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=${zoom}&size=${w}x${h}&markers=${lat},${lon},red-pushpin`;

  const upstream = await fetch(upstreamUrl, {
    headers: {
      "User-Agent": "pbc-portal/1.0",
      Accept: "image/png,image/*;q=0.8,*/*;q=0.1",
    },
    next: { revalidate: 60 * 60 * 24 },
  }).catch(() => null);

  if (!upstream || !upstream.ok) {
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }

  const bytes = await upstream.arrayBuffer();
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/png",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
