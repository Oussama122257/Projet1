import crypto from "node:crypto";
import type { Platform } from "@/lib/db";
import type { NormalizedMetrics } from "./types";

/**
 * Deterministic simulated metrics for local development.
 *
 * Real platform credentials require an approved developer app, which nobody has
 * on day one. These numbers are seeded from the content id so a given post
 * always produces the same curve — charts stay stable across restarts instead of
 * jittering randomly — and grow with elapsed time so the hourly sync produces a
 * believable series.
 */

function hashToUnit(input: string): number {
  const hash = crypto.createHash("sha256").update(input).digest();
  return hash.readUInt32BE(0) / 0xffffffff;
}

function seededNoise(seed: string, step: number): number {
  return hashToUnit(`${seed}:${step}`);
}

export function mockMetrics(
  platform: Platform,
  contentId: string,
  opts: {
    /** Hours since the post went live. Drives the growth curve. */
    ageHours?: number;
    /** Force an implausible pattern so fraud rules can be demonstrated. */
    profile?: "normal" | "botted" | "click_farm" | "viral";
  } = {}
): NormalizedMetrics {
  const { ageHours = 24, profile = "normal" } = opts;
  const base = hashToUnit(contentId);
  const hours = Math.max(1, ageHours);

  // Views follow a decaying-growth curve: fast early, flattening out.
  const audience = 20_000 + Math.floor(base * 480_000);
  const saturation = 1 - Math.exp(-hours / 36);
  let views = Math.floor(audience * saturation * (0.6 + base * 0.8));

  if (profile === "viral") views = Math.floor(views * (3 + base * 6));

  const engagementRate = 0.03 + base * 0.05;
  let likes = Math.floor(views * engagementRate);
  let comments = Math.floor(likes * (0.04 + seededNoise(contentId, 1) * 0.06));
  let shares = Math.floor(likes * (0.08 + seededNoise(contentId, 2) * 0.1));

  const ctr = 0.012 + seededNoise(contentId, 3) * 0.02;
  let clicks = Math.floor(views * ctr);

  let geo: Record<string, number> = {
    DZ: 0.34 + seededNoise(contentId, 4) * 0.12,
    FR: 0.18 + seededNoise(contentId, 5) * 0.08,
    MA: 0.12,
    TN: 0.09,
    US: 0.08,
    CA: 0.06,
  };

  if (profile === "botted") {
    // Enormous reach, essentially nobody clicking, one region dominating.
    views = Math.max(views, 180_000);
    clicks = Math.floor(seededNoise(contentId, 6) * 6);
    likes = Math.floor(views * 0.001);
    comments = 2;
    shares = 1;
    geo = { DZ: 0.93, FR: 0.04, US: 0.03 };
  }

  if (profile === "click_farm") {
    // Clicks outpacing any plausible organic rate.
    clicks = Math.floor(views * (0.45 + seededNoise(contentId, 7) * 0.2));
    geo = { RU: 0.78, DZ: 0.12, US: 0.1 };
  }

  const total = Object.values(geo).reduce((a, b) => a + b, 0);
  const geoDistribution = Object.fromEntries(
    Object.entries(geo).map(([k, v]) => [k, Number((v / total).toFixed(4))])
  );

  // Impressions always exceed views (a scroll-past counts); reach is unique users.
  const impressions = Math.floor(views * (1.15 + seededNoise(contentId, 8) * 0.35));
  const reach = Math.floor(views * (0.82 + seededNoise(contentId, 9) * 0.12));

  return {
    platform,
    contentId,
    views,
    likes,
    comments,
    shares,
    impressions,
    reach,
    clicks,
    geoDistribution,
    capturedAt: new Date(),
    available: [
      "views",
      "likes",
      "comments",
      "shares",
      "impressions",
      "reach",
      "clicks",
    ],
  };
}
