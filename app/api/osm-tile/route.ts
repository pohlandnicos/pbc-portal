import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/security/rateLimit";

export const runtime = "nodejs";

const schema = z
  .object({
    z: z.coerce.number().int().min(0).max(19),
    x: z.coerce.number().int().min(0),
    y: z.coerce.number().int().min(0),
  })
  .strict();

const TRANSPARENT_PNG_1X1_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7WnHkAAAAASUVORK5CYII=";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`osm-tile:${ip}`, { limit: 240, windowSeconds: 60 });
  if (!rl.ok) {
    const bytes = Buffer.from(TRANSPARENT_PNG_1X1_BASE64, "base64");
    return new NextResponse(bytes, {
      status: 429,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
        "Retry-After": String(rl.retryAfterSeconds),
      },
    });
  }

  const url = new URL(request.url);
  const parsed = schema.safeParse({
    z: url.searchParams.get("z"),
    x: url.searchParams.get("x"),
    y: url.searchParams.get("y"),
  });

  if (!parsed.success) {
    const bytes = Buffer.from(TRANSPARENT_PNG_1X1_BASE64, "base64");
    return new NextResponse(bytes, {
      status: 400,
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  }

  const { z, x, y } = parsed.data;
  const max = 2 ** z;
  if (x >= max || y >= max) {
    const bytes = Buffer.from(TRANSPARENT_PNG_1X1_BASE64, "base64");
    return new NextResponse(bytes, {
      status: 400,
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  }

  const upstreamUrl = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
  const upstream = await fetch(upstreamUrl, {
    headers: {
      "User-Agent": "pbc-portal/1.0",
      Accept: "image/png,image/*;q=0.8,*/*;q=0.1",
    },
    next: { revalidate: 60 * 60 * 24 * 7 },
  }).catch(() => null);

  if (!upstream || !upstream.ok) {
    const bytes = Buffer.from(TRANSPARENT_PNG_1X1_BASE64, "base64");
    return new NextResponse(bytes, {
      status: 502,
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  }

  const bytes = Buffer.from(await upstream.arrayBuffer());
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=604800, s-maxage=604800",
    },
  });
}
