import "dotenv/config";
import assert from "node:assert/strict";
import { PricingModel } from "@prisma/client";
import { evaluateRules, type FraudContext } from "../fraudDetection";
import { calculateCappedEarnings, calculateEarnings } from "../paymentService";

/**
 * Rule and earnings verification.
 *
 * Runs with `npm run test` — plain assertions on the two pure functions that
 * decide whether money moves, so there is no framework to install and no
 * database required. The fraud rules and the earnings math are the parts of
 * this system where being wrong costs real money, so they get direct coverage.
 */

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed++;
    console.log(`  FAIL  ${name}`);
    console.log(`        ${err instanceof Error ? err.message : String(err)}`);
  }
}

function snapshot(
  views: number,
  clicks: number,
  hoursAgo: number,
  geo?: Record<string, number>
) {
  return {
    id: "snap",
    applicationId: "app",
    capturedAt: new Date(Date.now() - hoursAgo * 3_600_000),
    views,
    likes: 0,
    comments: 0,
    shares: 0,
    impressions: 0,
    reach: 0,
    clicks,
    viewsDelta: 0,
    clicksDelta: 0,
    geoDistribution: geo ?? null,
    earningsCents: 0,
  };
}

function reasonsFor(ctx: FraudContext): string[] {
  return evaluateRules(ctx)
    .map((c) => c.reason as string)
    .sort();
}

const SPREAD = { DZ: 0.4, FR: 0.35, US: 0.25 };

console.log("\nFraud rules");

test("clean post raises nothing", () => {
  const reasons = reasonsFor({
    application: { id: "a", views: 200_000, clicks: 3_000 },
    snapshots: [
      snapshot(200_000, 3_000, 0, SPREAD),
      snapshot(180_000, 2_700, 4),
      snapshot(150_000, 2_200, 8),
      snapshot(120_000, 1_800, 12),
    ],
  });
  assert.deepEqual(reasons, []);
});

test("purchased views flag low engagement and geo concentration", () => {
  const reasons = reasonsFor({
    application: { id: "a", views: 180_000, clicks: 4 },
    snapshots: [snapshot(180_000, 4, 0, { DZ: 0.94, FR: 0.04, US: 0.02 })],
  });
  assert.deepEqual(reasons, ["GEO_CONCENTRATION", "LOW_ENGAGEMENT_RATIO"]);
});

test("click farm flags an implausible click-through rate", () => {
  const reasons = reasonsFor({
    application: { id: "a", views: 50_000, clicks: 24_000 },
    snapshots: [snapshot(50_000, 24_000, 0, { RU: 0.81, DZ: 0.11, US: 0.08 })],
  });
  assert.deepEqual(reasons, ["CLICK_VIEW_ANOMALY", "GEO_CONCENTRATION"]);
});

test("sustained hourly explosion flags a spike", () => {
  const reasons = reasonsFor({
    application: { id: "a", views: 512_000, clicks: 9_000 },
    snapshots: [
      snapshot(512_000, 9_000, 0, SPREAD),
      snapshot(64_000, 1_100, 1),
      snapshot(8_000, 140, 2),
      snapshot(1_000, 20, 3),
    ],
  });
  assert.deepEqual(reasons, ["SPIKE_ANOMALY"]);
});

test("one-off spike is not flagged — genuine virality must survive", () => {
  const reasons = reasonsFor({
    application: { id: "a", views: 60_000, clicks: 900 },
    snapshots: [
      snapshot(60_000, 900, 0, SPREAD),
      snapshot(50_000, 780, 1),
      snapshot(45_000, 700, 2),
      snapshot(5_000, 80, 3),
    ],
  });
  assert.deepEqual(reasons, []);
});

test("a legitimately single-country audience is not flagged", () => {
  const reasons = reasonsFor({
    application: { id: "a", views: 9_000, clicks: 180 },
    snapshots: [snapshot(9_000, 180, 0, { DZ: 1.0 })],
  });
  assert.deepEqual(reasons, []);
});

console.log("\nEarnings");

test("CPM pays per 1,000 views", () => {
  const result = calculateEarnings(
    { views: 250_000, clicks: 4_000 },
    PricingModel.CPM,
    { cpmRate: 320, cpcRate: 0 }
  );
  assert.equal(result.totalCents, 80_000); // $800.00
});

test("CPC pays per click and ignores views", () => {
  const result = calculateEarnings(
    { views: 250_000, clicks: 4_000 },
    PricingModel.CPC,
    { cpmRate: 0, cpcRate: 42 }
  );
  assert.equal(result.totalCents, 168_000); // $1,680.00
});

test("hybrid sums both components", () => {
  const result = calculateEarnings(
    { views: 250_000, clicks: 4_000 },
    PricingModel.HYBRID,
    { cpmRate: 180, cpcRate: 25 }
  );
  assert.equal(result.totalCents, 145_000); // $1,450.00
});

test("fractional cents round down, never up", () => {
  // 1,999 views at $1.00/1k = 199.9 cents → 199, never 200.
  const result = calculateEarnings({ views: 1_999, clicks: 0 }, PricingModel.CPM, {
    cpmRate: 100,
    cpcRate: 0,
  });
  assert.equal(result.totalCents, 199);
});

test("negative or fractional inputs cannot inflate earnings", () => {
  const result = calculateEarnings(
    { views: -5_000, clicks: -10 },
    PricingModel.HYBRID,
    { cpmRate: 500, cpcRate: 100 }
  );
  assert.equal(result.totalCents, 0);
});

test("a viral post cannot overdraw the campaign budget", () => {
  const result = calculateCappedEarnings(
    { views: 5_000_000, clicks: 0 },
    {
      pricingModel: PricingModel.CPM,
      cpmRate: 320,
      cpcRate: 0,
      budgetCents: 100_000, // $1,000 budget
    },
    40_000 // $400 already accrued by others
  );
  assert.equal(result.cappedCents, 60_000); // only $600 of headroom left
  assert.equal(result.wasCapped, true);
});

test("an exhausted budget yields zero, not a negative balance", () => {
  const result = calculateCappedEarnings(
    { views: 1_000_000, clicks: 0 },
    {
      pricingModel: PricingModel.CPM,
      cpmRate: 320,
      cpcRate: 0,
      budgetCents: 100_000,
    },
    150_000 // already over budget
  );
  assert.equal(result.cappedCents, 0);
});

console.log(
  `\n${passed} passed, ${failed} failed\n`
);

process.exit(failed > 0 ? 1 : 0);
