type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

const inMemory = new Map<string, { count: number; resetAtMs: number }>();

export function rateLimit(
  key: string,
  { limit, windowSeconds }: { limit: number; windowSeconds: number }
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  const entry = inMemory.get(key);
  if (!entry || entry.resetAtMs <= now) {
    inMemory.set(key, { count: 1, resetAtMs: now + windowMs });
    return { ok: true };
  }

  if (entry.count >= limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAtMs - now) / 1000)),
    };
  }

  entry.count += 1;
  return { ok: true };
}
