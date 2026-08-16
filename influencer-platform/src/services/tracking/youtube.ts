import { Platform } from "@/lib/db";
import { flags } from "@/lib/env";
import { mockMetrics } from "./mock";
import {
  PlatformError,
  type FetchContext,
  type NormalizedMetrics,
  type PlatformFetcher,
} from "./types";

/**
 * YouTube — phase 2.
 *
 * Stubbed behind the shared interface. Two APIs are involved once this is real:
 *
 *   Data API v3 (public counters, no OAuth scope beyond readonly):
 *     GET https://www.googleapis.com/youtube/v3/videos
 *         ?part=statistics&id={videoId}
 *     → viewCount, likeCount, commentCount
 *
 *   Analytics API (owner-only, needs yt-analytics.readonly):
 *     GET https://youtubeanalytics.googleapis.com/v2/reports
 *         ?ids=channel==MINE&metrics=views,estimatedMinutesWatched
 *         &dimensions=country
 *     → the country dimension is what feeds geoDistribution for the
 *       GEO_CONCENTRATION fraud rule.
 *
 * The Data API alone can't populate geoDistribution, so the geo fraud rule
 * simply won't fire for YouTube until the Analytics call is wired in.
 */
export class YouTubeFetcher implements PlatformFetcher {
  readonly platform = Platform.YOUTUBE;

  isEnabled(): boolean {
    return flags.useMockMetrics;
  }

  async fetchMetrics(ctx: FetchContext): Promise<NormalizedMetrics> {
    if (flags.useMockMetrics) {
      return mockMetrics(this.platform, ctx.contentId);
    }

    throw new PlatformError(
      "YouTube tracking is not implemented yet (phase 2). " +
        "Set USE_MOCK_METRICS=true to simulate, or implement YouTubeFetcher.fetchMetrics.",
      this.platform,
      "NOT_IMPLEMENTED"
    );
  }
}

export const youtubeFetcher = new YouTubeFetcher();
