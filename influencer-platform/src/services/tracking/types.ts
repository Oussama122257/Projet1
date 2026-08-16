import type { Platform } from "@/lib/db";

/**
 * The single shape every platform normalises into.
 *
 * Platforms disagree on almost everything — TikTok has no impressions, YouTube
 * has no shares on the public API, Instagram splits reach from impressions. The
 * fetchers map what exists and leave the rest at zero, and `available` records
 * which fields were genuinely reported so the UI can distinguish "zero" from
 * "not measurable on this platform".
 */
export type NormalizedMetrics = {
  platform: Platform;
  contentId: string;

  views: number;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  reach: number;
  /** Link clicks. Rarely exposed publicly; usually attributed by our own redirect. */
  clicks: number;

  /** ISO country code → share of audience, summing to ~1. */
  geoDistribution?: Record<string, number>;

  capturedAt: Date;
  available: Array<keyof Pick<
    NormalizedMetrics,
    "views" | "likes" | "comments" | "shares" | "impressions" | "reach" | "clicks"
  >>;
};

export type FetchContext = {
  accessToken: string;
  contentId: string;
  /** Platform-native user id (TikTok open_id, IG user id, YT channel id). */
  platformUserId?: string;
};

export class PlatformError extends Error {
  constructor(
    message: string,
    readonly platform: Platform,
    readonly code:
      | "TOKEN_EXPIRED"
      | "RATE_LIMITED"
      | "NOT_FOUND"
      | "NOT_IMPLEMENTED"
      | "UNKNOWN" = "UNKNOWN",
    readonly retryable = false
  ) {
    super(message);
    this.name = "PlatformError";
  }
}

/**
 * Every platform adapter implements exactly this, so adding Instagram or
 * YouTube later is a drop-in — the sync job never learns a platform's name.
 */
export interface PlatformFetcher {
  readonly platform: Platform;
  /** False while the integration is stubbed or its credentials are missing. */
  isEnabled(): boolean;
  fetchMetrics(ctx: FetchContext): Promise<NormalizedMetrics>;
}

export function emptyMetrics(
  platform: Platform,
  contentId: string
): NormalizedMetrics {
  return {
    platform,
    contentId,
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    impressions: 0,
    reach: 0,
    clicks: 0,
    capturedAt: new Date(),
    available: [],
  };
}
