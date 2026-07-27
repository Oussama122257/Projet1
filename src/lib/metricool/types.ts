/**
 * Types for the official Metricool API (base https://app.metricool.com/api).
 * Source: Metricool API documentation (Technical Support Dept.) and the
 * official swagger at https://app.metricool.com/resources/apidocs/index.html
 * Exact body fields vary by network/publication type — the swagger file is
 * authoritative. All endpoint paths live in client.ts only.
 */

export interface MetricoolBrand {
  id: number | string;
  label?: string;
  // The simpleProfiles response includes per-network connection info; we keep
  // the full raw object because fields vary by connected networks.
  [key: string]: unknown;
}

export interface MetricoolDateSpec {
  dateTime: string; // "YYYY-MM-DDTHH:mm:ss"
  timezone: string; // IANA tz, e.g. "Europe/Madrid"
}

export interface MetricoolProviderSpec {
  network: string; // "instagram" | "facebook" | "tiktok" | ...
}

/** Request body for POST /v2/scheduler/posts (subset — see swagger). */
export interface CreateScheduledPostInput {
  publicationDate: MetricoolDateSpec;
  text: string;
  providers: MetricoolProviderSpec[];
  media?: string[];
  autoPublish?: boolean;
  draft?: boolean;
  shortener?: boolean;
  firstCommentText?: string;
  instagramData?: { autoPublish?: boolean; [key: string]: unknown };
  facebookData?: { type?: string; [key: string]: unknown };
  [key: string]: unknown;
}

export interface TimelinePoint {
  // timeline responses are [dateString, value] series or objects; raw-kept.
  [key: string]: unknown;
}
