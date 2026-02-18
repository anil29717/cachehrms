/** In-memory rate limit per API key (per hour). For multi-instance, use Redis. */
const store = new Map<string, { count: number; windowStart: number }>();

const HOUR_MS = 60 * 60 * 1000;

function getWindow(): number {
  return Math.floor(Date.now() / HOUR_MS) * HOUR_MS;
}

export function checkAndIncrement(apiKeyId: string, limit: number): { allowed: boolean } {
  const now = Date.now();
  const window = getWindow();
  const entry = store.get(apiKeyId);
  if (!entry || entry.windowStart !== window) {
    store.set(apiKeyId, { count: 1, windowStart: window });
    return { allowed: true };
  }
  if (entry.count >= limit) return { allowed: false };
  entry.count++;
  return { allowed: true };
}

export function getCurrentCount(apiKeyId: string): number {
  const window = getWindow();
  const entry = store.get(apiKeyId);
  if (!entry || entry.windowStart !== window) return 0;
  return entry.count;
}
