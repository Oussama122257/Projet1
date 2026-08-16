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
 * Instagram — phase 2.
 *
 * Deliberately a stub behind the shared interface. The Graph API call is
 * sketched below so wiring it up is a matter of filling in the fetch, not
 * reshaping the sync job. Requires a Business/Creator account linked to a
 * Facebook Page plus the instagram_manage_insights permission.
 *
 *   GET https://graph.instagram.com/v21.0/{media-id}/insights
 *       ?metric=impressions,reach,likes,comments,shares,saved
 *       &access_token={token}
 *
 * Note the field mapping quirk: Instagram reports `impressions` and `reach` but
 * no "views" for feed posts — for Reels, `plays` is the view equivalent, and
 * that is what should populate NormalizedMetrics.views.
 */
export class InstagramFetcher implements PlatformFetcher {
  readonly platform = Platform.INSTAGRAM;

  isEnabled(): boolean {
    // Mock mode lets the seeded UI render Instagram campaigns before the real
    // integration lands.
    return flags.useMockMetrics;
  }

  async fetchMetrics(ctx: FetchContext): Promise<NormalizedMetrics> {
    if (flags.useMockMetrics) {
      return mockMetrics(this.platform, ctx.contentId);
    }

    throw new PlatformError(
      "Instagram tracking is not implemented yet (phase 2). " +
        "Set USE_MOCK_METRICS=true to simulate, or implement InstagramFetcher.fetchMetrics.",
      this.platform,
      "NOT_IMPLEMENTED"
    );
  }
}

export const instagramFetcher = new InstagramFetcher();
