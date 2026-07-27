import { env } from "@/lib/env";
import { scoped } from "@/lib/logger";

const log = scoped("apify");

const BASE_URL = "https://api.apify.com/v2";
const MAX_RETRIES = 3;
const TIMEOUT_MS = 30_000;

export class ApifyApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(`Apify API ${status}: ${message}`);
  }
}

/**
 * Thin authenticated wrapper over the official Apify API v2.
 * Token lives server-side only. Retries 429/5xx/network with exponential
 * backoff + jitter, honoring Retry-After.
 */
export class ApifyClient {
  private token: string;

  constructor(token?: string) {
    const t = token ?? env().APIFY_API_TOKEN;
    if (!t) throw new Error("APIFY_API_TOKEN is not configured");
    this.token = t;
  }

  async request<T>(
    path: string,
    init: { method?: string; body?: unknown; query?: Record<string, string | number> } = {},
  ): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);
    for (const [k, v] of Object.entries(init.query ?? {})) {
      url.searchParams.set(k, String(v));
    }

    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(url, {
          method: init.method ?? "GET",
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
          body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });

        if (res.status === 429 || res.status >= 500) {
          const retryAfter = Number(res.headers.get("retry-after")) || 0;
          lastError = new ApifyApiError(res.status, await res.text().catch(() => ""));
          await backoff(attempt, retryAfter);
          continue;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => undefined);
          const message =
            (body as { error?: { message?: string } })?.error?.message ?? res.statusText;
          throw new ApifyApiError(res.status, message, body);
        }
        if (res.status === 204) return undefined as T;
        return (await res.json()) as T;
      } catch (err) {
        if (err instanceof ApifyApiError && err.status < 500 && err.status !== 429) throw err;
        lastError = err;
        if (attempt < MAX_RETRIES) {
          log.warn({ path, attempt, err: String(err) }, "apify request retrying");
          await backoff(attempt, 0);
        }
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }
}

async function backoff(attempt: number, retryAfterSeconds: number): Promise<void> {
  const base = retryAfterSeconds > 0 ? retryAfterSeconds * 1000 : 2000 * 2 ** attempt;
  const jitter = Math.random() * 500;
  await new Promise((r) => setTimeout(r, base + jitter));
}
