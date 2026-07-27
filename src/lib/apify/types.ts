/** Types for the official Apify API v2 (https://docs.apify.com/api/v2). */

export type ApifyRunStatusValue =
  | "READY"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "TIMING-OUT"
  | "TIMED-OUT"
  | "ABORTING"
  | "ABORTED";

export interface ApifyRunData {
  id: string;
  actId: string;
  status: ApifyRunStatusValue;
  startedAt: string;
  finishedAt: string | null;
  defaultDatasetId: string;
  defaultKeyValueStoreId: string;
  exitCode?: number;
  statusMessage?: string;
}

export interface ApifyActorData {
  id: string;
  name: string;
  username: string;
  title?: string;
}

/**
 * Normalized shape produced from raw Actor dataset items. We do NOT assume a
 * specific Actor output schema — the normalizer maps configurable field paths
 * with defaults covering common Instagram scraper Actor outputs, and keeps the
 * full raw item for auditing/re-mapping.
 */
export interface NormalizedMediaItem {
  platform: string;
  platformMediaId: string | null;
  originalUrl: string;
  canonicalUrl: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  caption: string | null;
  hashtags: string[];
  duration: number | null;
  width: number | null;
  height: number | null;
  publishedAt: Date | null;
  mimeType: string | null;
  raw: unknown;
}

/** Configurable mapping from raw dataset item fields to normalized fields. */
export interface ApifyFieldMap {
  platformMediaId: string[];
  originalUrl: string[];
  mediaUrl: string[];
  thumbnailUrl: string[];
  caption: string[];
  duration: string[];
  width: string[];
  height: string[];
  publishedAt: string[];
}
