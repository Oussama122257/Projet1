import { scoped } from "@/lib/logger";
import type { CreateScheduledPostInput, MetricoolBrand } from "./types";

const log = scoped("metricool");

/**
 * Client for the official Metricool API.
 *
 * Facts per official documentation:
 *  - Base URL: https://app.metricool.com/api
 *  - Auth: X-Mc-Auth header carrying the account userToken
 *    (Account Settings → API; Advanced/Custom plans)
 *  - Every endpoint additionally requires userId and blogId parameters
 *  - Endpoints used here: /admin/simpleProfiles, /v2/scheduler/posts,
 *    /actions/normalize/image/url, /stats/timeline/{metric},
 *    /v2/analytics/reels/instagram
 *
 * The userToken is decrypted just-in-time by callers and never logged.
 */
const BASE_URL = process.env.METRICOOL_BASE_URL ?? "https://app.metricool.com/api";
const MAX_RETRIES = 3;
const TIMEOUT_MS = 30_000;

export class MetricoolApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(`Metricool API ${status}: ${message}`);
  }

  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

export interface MetricoolCredentials {
  userToken: string;
  userId: string;
  blogId?: string;
}

export class MetricoolClient {
  constructor(private creds: MetricoolCredentials) {}

  private async request<T>(
    path: string,
    init: {
      method?: string;
      body?: unknown;
      query?: Record<string, string | number | undefined>;
      blogId?: string;
    } = {},
  ): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);
    url.searchParams.set("userId", this.creds.userId);
    const blogId = init.blogId ?? this.creds.blogId;
    if (blogId) url.searchParams.set("blogId", blogId);
    for (const [k, v] of Object.entries(init.query ?? {})) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }

    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(url, {
          method: init.method ?? "GET",
          headers: {
            "X-Mc-Auth": this.creds.userToken,
            "Content-Type": "application/json",
          },
          body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });

        if (res.status === 429 || res.status >= 500) {
          lastError = new MetricoolApiError(res.status, await res.text().catch(() => ""));
          await backoff(attempt);
          continue;
        }
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new MetricoolApiError(res.status, body.slice(0, 500) || res.statusText);
        }
        const text = await res.text();
        return (text ? JSON.parse(text) : undefined) as T;
      } catch (err) {
        if (err instanceof MetricoolApiError && err.status < 500 && err.status !== 429) {
          throw err;
        }
        lastError = err;
        if (attempt < MAX_RETRIES) {
          log.warn({ path, attempt, err: String(err) }, "metricool request retrying");
          await backoff(attempt);
        }
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  /** GET /admin/simpleProfiles — list the account's brands ("blogs"). */
  async getBrands(): Promise<MetricoolBrand[]> {
    return this.request<MetricoolBrand[]>("/admin/simpleProfiles");
  }

  /** Cheap connectivity/credentials check. */
  async healthCheck(): Promise<boolean> {
    try {
      await this.getBrands();
      return true;
    } catch (err) {
      if (err instanceof MetricoolApiError && err.isAuthError) return false;
      throw err;
    }
  }

  /**
   * GET /actions/normalize/image/url — Metricool copies the (publicly
   * accessible) media to its own servers and returns the hosted URL, which
   * must be used as the media value in /v2/scheduler/posts.
   */
  async normalizeMediaUrl(publicUrl: string, blogId: string): Promise<string> {
    const res = await this.request<unknown>("/actions/normalize/image/url", {
      blogId,
      query: { url: publicUrl },
    });
    if (typeof res === "string") return res;
    const obj = res as { url?: string; data?: string };
    const normalized = obj?.url ?? obj?.data;
    if (!normalized) throw new MetricoolApiError(502, "normalize returned no URL", res);
    return normalized;
  }

  /** POST /v2/scheduler/posts — create a scheduled post in the planner. */
  async createScheduledPost(
    input: CreateScheduledPostInput,
    blogId: string,
  ): Promise<{ id?: string | number; [key: string]: unknown }> {
    return this.request("/v2/scheduler/posts", {
      method: "POST",
      body: input,
      blogId,
    });
  }

  /** GET /stats/timeline/{metric}?start&end — e.g. metric "igFollowers". */
  async getTimeline(
    metric: string,
    blogId: string,
    range: { start: string; end: string },
  ): Promise<unknown> {
    return this.request(`/stats/timeline/${encodeURIComponent(metric)}`, {
      blogId,
      query: { start: range.start, end: range.end },
    });
  }

  /** GET /v2/analytics/reels/instagram?from&to — Instagram Reels analytics. */
  async getReelsAnalytics(
    blogId: string,
    range: { from: string; to: string },
  ): Promise<unknown> {
    return this.request("/v2/analytics/reels/instagram", {
      blogId,
      query: { from: range.from, to: range.to },
    });
  }
}

async function backoff(attempt: number): Promise<void> {
  await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt + Math.random() * 500));
}
