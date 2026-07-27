import type { ApifyFieldMap, NormalizedMediaItem } from "./types";

/**
 * Default field mapping. Each normalized field lists candidate paths tried in
 * order against the raw dataset item. These defaults cover field names common
 * across documented Instagram scraper Actor outputs, but the map is fully
 * configurable per deployment — no single Actor schema is assumed.
 */
export const DEFAULT_FIELD_MAP: ApifyFieldMap = {
  platformMediaId: ["id", "shortCode", "shortcode", "pk", "mediaId"],
  originalUrl: ["url", "postUrl", "permalink", "link"],
  mediaUrl: ["videoUrl", "video_url", "videoUrls.0", "displayUrl", "imageUrl"],
  thumbnailUrl: ["displayUrl", "thumbnailUrl", "thumbnail_src", "imageUrl"],
  caption: ["caption", "text", "description", "edge_media_to_caption.edges.0.node.text"],
  duration: ["videoDuration", "duration", "video_duration"],
  width: ["dimensionsWidth", "dimensions.width", "width"],
  height: ["dimensionsHeight", "dimensions.height", "height"],
  publishedAt: ["timestamp", "takenAt", "taken_at_timestamp", "publishedAt", "createdAt"],
};

function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

function firstMatch(item: unknown, paths: string[]): unknown {
  for (const p of paths) {
    const v = getPath(item, p);
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
}

function toNumber(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
}

function toDate(v: unknown): Date | null {
  if (v == null) return null;
  if (typeof v === "number") {
    // Heuristic: epoch seconds vs milliseconds
    const ms = v < 10_000_000_000 ? v * 1000 : v;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}

export function extractHashtags(caption: string | null): string[] {
  if (!caption) return [];
  const matches = caption.match(/#[\p{L}\p{N}_]+/gu) ?? [];
  return [...new Set(matches.map((h) => h.toLowerCase()))];
}

/** Strip query strings/fragments for canonical URL dedupe. */
export function canonicalizeUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    u.search = "";
    u.hash = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return url;
  }
}

export class ApifyNormalizer {
  constructor(
    private platform: string = "instagram",
    private fieldMap: ApifyFieldMap = DEFAULT_FIELD_MAP,
  ) {}

  normalize(rawItem: unknown): NormalizedMediaItem | null {
    const originalUrl = firstMatch(rawItem, this.fieldMap.originalUrl);
    const mediaUrl = firstMatch(rawItem, this.fieldMap.mediaUrl);
    // Without at least a post URL or a media URL the item is unusable.
    if (typeof originalUrl !== "string" && typeof mediaUrl !== "string") return null;

    const caption = firstMatch(rawItem, this.fieldMap.caption);
    const captionStr = typeof caption === "string" ? caption : null;
    const platformMediaId = firstMatch(rawItem, this.fieldMap.platformMediaId);

    return {
      platform: this.platform,
      platformMediaId: platformMediaId != null ? String(platformMediaId) : null,
      originalUrl: typeof originalUrl === "string" ? originalUrl : String(mediaUrl),
      canonicalUrl: canonicalizeUrl(typeof originalUrl === "string" ? originalUrl : null),
      mediaUrl: typeof mediaUrl === "string" ? mediaUrl : null,
      thumbnailUrl: (firstMatch(rawItem, this.fieldMap.thumbnailUrl) as string | null) ?? null,
      caption: captionStr,
      hashtags: extractHashtags(captionStr),
      duration: toNumber(firstMatch(rawItem, this.fieldMap.duration)),
      width: toNumber(firstMatch(rawItem, this.fieldMap.width)),
      height: toNumber(firstMatch(rawItem, this.fieldMap.height)),
      publishedAt: toDate(firstMatch(rawItem, this.fieldMap.publishedAt)),
      mimeType: null,
      raw: rawItem,
    };
  }

  normalizeAll(rawItems: unknown[]): NormalizedMediaItem[] {
    return rawItems
      .map((i) => this.normalize(i))
      .filter((i): i is NormalizedMediaItem => i !== null);
  }
}
