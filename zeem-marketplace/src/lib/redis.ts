import { Redis } from "@upstash/redis";

/**
 * Upstash Redis — used to cache the wilaya/commune list (it never changes
 * between seeds) and courier fee lookups, keeping checkout snappy.
 * Falls back to a no-op in dev when Upstash creds are absent.
 */
const hasRedis =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = hasRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  if (!redis) return fetcher();
  try {
    const hit = await redis.get<T>(key);
    if (hit !== null && hit !== undefined) return hit;
    const value = await fetcher();
    await redis.set(key, value, { ex: ttlSeconds });
    return value;
  } catch {
    // Redis being down must never break checkout — degrade to DB.
    return fetcher();
  }
}
