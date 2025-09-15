type Entry = { timestamps: number[] };

const RL_GLOBAL_KEY = Symbol.for('app.rateLimit');
const globalAny = globalThis as any;

if (!globalAny[RL_GLOBAL_KEY]) {
  globalAny[RL_GLOBAL_KEY] = new Map<string, Entry>();
}

const store: Map<string, Entry> = globalAny[RL_GLOBAL_KEY];

export function rateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const entry = store.get(key) ?? { timestamps: [] };
  // drop old timestamps
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
  if (entry.timestamps.length >= limit) {
    const retryAfterMs = windowMs - (now - entry.timestamps[0]!);
    store.set(key, entry);
    return { ok: false as const, retryAfterMs };
  }
  entry.timestamps.push(now);
  store.set(key, entry);
  return { ok: true as const };
}

export function ipFromRequestHeaders(headers: Headers) {
  const xf = headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0]!.trim();
  const xr = headers.get('x-real-ip');
  if (xr) return xr.trim();
  return 'unknown';
}

