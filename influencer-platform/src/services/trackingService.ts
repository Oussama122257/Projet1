import { Platform, prisma } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import { getSocialToken } from "./socialAuth";
import { instagramFetcher } from "./tracking/instagram";
import { tiktokFetcher } from "./tracking/tiktok";
import { youtubeFetcher } from "./tracking/youtube";
import {
  PlatformError,
  type NormalizedMetrics,
  type PlatformFetcher,
} from "./tracking/types";

export type { NormalizedMetrics } from "./tracking/types";
export { PlatformError } from "./tracking/types";

const log = createLogger("tracking");

const FETCHERS: Record<Platform, PlatformFetcher> = {
  [Platform.TIKTOK]: tiktokFetcher,
  [Platform.INSTAGRAM]: instagramFetcher,
  [Platform.YOUTUBE]: youtubeFetcher,
};

export function getFetcher(platform: Platform): PlatformFetcher {
  return FETCHERS[platform];
}

export function supportedPlatforms(): Platform[] {
  return (Object.keys(FETCHERS) as Platform[]).filter((p) =>
    FETCHERS[p].isEnabled()
  );
}

export type MetricsFetchResult =
  | { ok: true; metrics: NormalizedMetrics }
  | { ok: false; error: string; code: string; retryable: boolean };

/**
 * Fetch current metrics for one application's submitted content.
 *
 * Errors are returned rather than thrown: the hourly sync walks hundreds of
 * applications and one creator's expired token must not abort the whole run.
 */
export async function fetchMetricsForApplication(applicationId: string): Promise<
  MetricsFetchResult
> {
  const app = await prisma.influencerApplication.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      platform: true,
      contentId: true,
      influencerId: true,
    },
  });

  if (!app) {
    return { ok: false, error: "Application not found", code: "NOT_FOUND", retryable: false };
  }
  if (!app.platform || !app.contentId) {
    return {
      ok: false,
      error: "No content submitted yet",
      code: "NO_CONTENT",
      retryable: false,
    };
  }

  const fetcher = getFetcher(app.platform);
  if (!fetcher.isEnabled()) {
    return {
      ok: false,
      error: `${app.platform} tracking is not enabled`,
      code: "NOT_IMPLEMENTED",
      retryable: false,
    };
  }

  const token = await getSocialToken(app.influencerId, app.platform);
  if (!token) {
    return {
      ok: false,
      error: `${app.platform} account is not connected`,
      code: "NOT_CONNECTED",
      retryable: false,
    };
  }

  try {
    const metrics = await fetcher.fetchMetrics({
      accessToken: token.accessToken,
      contentId: app.contentId,
      platformUserId: token.platformUserId,
    });
    return { ok: true, metrics };
  } catch (err) {
    if (err instanceof PlatformError) {
      log.warn("metric fetch failed", {
        applicationId,
        platform: app.platform,
        code: err.code,
        message: err.message,
      });
      return {
        ok: false,
        error: err.message,
        code: err.code,
        retryable: err.retryable,
      };
    }
    const message = err instanceof Error ? err.message : String(err);
    log.error("metric fetch threw", { applicationId, message });
    return { ok: false, error: message, code: "UNKNOWN", retryable: true };
  }
}

/**
 * Merge freshly fetched metrics with what we already had.
 *
 * Counters are monotonic by nature; a platform briefly reporting a lower number
 * (eventual consistency, a cache miss) must not look like negative growth or
 * claw back earnings, so we take the max. Clicks are the exception — those are
 * attributed by our own redirect layer, which is authoritative.
 */
export function mergeMetrics(
  previous: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
  },
  fresh: NormalizedMetrics,
  attributedClicks: number
) {
  return {
    views: Math.max(previous.views, fresh.views),
    likes: Math.max(previous.likes, fresh.likes),
    comments: Math.max(previous.comments, fresh.comments),
    shares: Math.max(previous.shares, fresh.shares),
    impressions: Math.max(previous.impressions, fresh.impressions),
    reach: fresh.reach,
    clicks: attributedClicks,
    geoDistribution: fresh.geoDistribution,
  };
}
