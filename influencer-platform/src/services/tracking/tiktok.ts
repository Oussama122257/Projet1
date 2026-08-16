import { Platform } from "@/lib/db";
import { flags } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { mockMetrics } from "./mock";
import {
  PlatformError,
  type FetchContext,
  type NormalizedMetrics,
  type PlatformFetcher,
} from "./types";

const log = createLogger("tracking:tiktok");

const VIDEO_QUERY_URL = "https://open.tiktokapis.com/v2/video/query/";

/**
 * Fields TikTok's Display API exposes per video. `view_count` is the metric
 * campaigns are priced on; TikTok reports no impressions and no link clicks, so
 * those stay at zero and are attributed by our own redirect layer instead.
 */
const VIDEO_FIELDS = [
  "id",
  "title",
  "view_count",
  "like_count",
  "comment_count",
  "share_count",
  "create_time",
] as const;

type TikTokVideo = {
  id: string;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  create_time?: number;
};

type TikTokResponse = {
  data?: { videos?: TikTokVideo[] };
  error?: { code?: string; message?: string; log_id?: string };
};

/**
 * TikTok is the first-class integration — the Algeria launch market runs on it,
 * so it is fully implemented while Instagram and YouTube stay stubbed behind the
 * same interface.
 */
export class TikTokFetcher implements PlatformFetcher {
  readonly platform = Platform.TIKTOK;

  isEnabled(): boolean {
    return flags.tiktokReady || flags.useMockMetrics;
  }

  async fetchMetrics(ctx: FetchContext): Promise<NormalizedMetrics> {
    if (flags.useMockMetrics) {
      return mockMetrics(this.platform, ctx.contentId);
    }

    if (!flags.tiktokReady) {
      throw new PlatformError(
        "TikTok credentials are not configured",
        this.platform,
        "NOT_IMPLEMENTED"
      );
    }

    const res = await fetch(
      `${VIDEO_QUERY_URL}?fields=${VIDEO_FIELDS.join(",")}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ctx.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filters: { video_ids: [ctx.contentId] } }),
        // Never let a slow platform call wedge the hourly sync.
        signal: AbortSignal.timeout(15_000),
      }
    );

    if (res.status === 401 || res.status === 403) {
      throw new PlatformError(
        "TikTok access token rejected — reconnect required",
        this.platform,
        "TOKEN_EXPIRED"
      );
    }

    if (res.status === 429) {
      throw new PlatformError(
        "TikTok rate limit reached",
        this.platform,
        "RATE_LIMITED",
        true
      );
    }

    if (!res.ok) {
      throw new PlatformError(
        `TikTok API returned ${res.status}`,
        this.platform,
        "UNKNOWN",
        res.status >= 500
      );
    }

    const body = (await res.json()) as TikTokResponse;

    if (body.error?.code && body.error.code !== "ok") {
      log.warn("tiktok api error", {
        code: body.error.code,
        logId: body.error.log_id,
      });
      throw new PlatformError(
        body.error.message ?? "TikTok API error",
        this.platform,
        "UNKNOWN"
      );
    }

    const video = body.data?.videos?.[0];
    if (!video) {
      throw new PlatformError(
        `Video ${ctx.contentId} not found or not owned by this account`,
        this.platform,
        "NOT_FOUND"
      );
    }

    return {
      platform: this.platform,
      contentId: video.id,
      views: video.view_count ?? 0,
      likes: video.like_count ?? 0,
      comments: video.comment_count ?? 0,
      shares: video.share_count ?? 0,
      // TikTok's Display API exposes neither impressions nor link clicks.
      impressions: 0,
      reach: 0,
      clicks: 0,
      capturedAt: new Date(),
      available: ["views", "likes", "comments", "shares"],
    };
  }
}

export const tiktokFetcher = new TikTokFetcher();
