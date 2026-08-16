import "dotenv/config";
import bcrypt from "bcryptjs";
import { encryptJson } from "../src/lib/crypto";
import {
  ApplicationStatus,
  CampaignStatus,
  FraudReason,
  FraudSeverity,
  PayoutState,
  PayoutStatus,
  Platform,
  PrismaClient,
  PricingModel,
  Role,
  StripeConnectStatus,
  VerificationStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Demo dataset.
 *
 * Everything here is fabricated but internally consistent: snapshot series
 * actually integrate to the totals on each application, earnings are derived
 * from each campaign's real pricing rules, and the flagged applications carry
 * metric patterns that genuinely trip the fraud rules — so the admin queue shows
 * evidence that matches the rule that fired.
 */

const PASSWORD = "password123";

// Deterministic PRNG so reseeding produces the same charts.
function makeRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}
const rand = makeRandom(20260816);

function pick<T>(items: T[]): T {
  return items[Math.floor(rand() * items.length)];
}

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 3600_000);
}

function daysFromNow(d: number): Date {
  return new Date(Date.now() + d * 86_400_000);
}

/** Mirrors calculateEarnings() — kept inline so the seed has no app imports. */
function earningsFor(
  model: PricingModel,
  rates: { cpmRate: number; cpcRate: number },
  views: number,
  clicks: number
): number {
  const cpm =
    model === PricingModel.CPM || model === PricingModel.HYBRID
      ? Math.floor((views * rates.cpmRate) / 1000)
      : 0;
  const cpc =
    model === PricingModel.CPC || model === PricingModel.HYBRID
      ? clicks * rates.cpcRate
      : 0;
  return cpm + cpc;
}

type GrowthProfile = "steady" | "viral" | "slow" | "botted" | "click_farm";

/**
 * Build an hourly view/click series.
 *
 * Views follow a saturating curve (fast early, flattening) rather than a
 * straight line, because that is what real content does and the SPIKE_ANOMALY
 * rule only makes sense against a believable baseline.
 */
function buildSeries(
  profile: GrowthProfile,
  hours: number,
  ceiling: number
): { views: number; clicks: number; geo: Record<string, number> }[] {
  const series: { views: number; clicks: number; geo: Record<string, number> }[] = [];

  const normalGeo = { DZ: 0.38, FR: 0.19, MA: 0.14, TN: 0.11, US: 0.1, CA: 0.08 };
  const bottedGeo = { DZ: 0.94, FR: 0.04, US: 0.02 };
  const farmGeo = { RU: 0.81, DZ: 0.11, US: 0.08 };

  for (let h = 0; h <= hours; h++) {
    const t = h / hours;
    let views: number;

    switch (profile) {
      case "viral":
        // Slow burn, then an inflection around 40% through.
        views = Math.floor(ceiling * Math.pow(t, 0.45) * (t > 0.4 ? 1.35 : 0.55));
        break;
      case "slow":
        views = Math.floor(ceiling * t * 0.42);
        break;
      case "botted":
        // Purchased views arrive in a near-vertical wall early on.
        views = Math.floor(ceiling * Math.min(1, Math.pow(t * 3.4, 2.6)));
        break;
      case "click_farm":
        views = Math.floor(ceiling * (1 - Math.exp(-3.2 * t)));
        break;
      default:
        views = Math.floor(ceiling * (1 - Math.exp(-2.6 * t)));
    }

    views = Math.max(0, views + Math.floor((rand() - 0.5) * ceiling * 0.012));
    views = h === 0 ? Math.floor(views * 0.4) : views;

    let clicks: number;
    let geo: Record<string, number>;

    if (profile === "botted") {
      clicks = Math.min(7, Math.floor(views / 40_000));
      geo = bottedGeo;
    } else if (profile === "click_farm") {
      clicks = Math.floor(views * 0.47);
      geo = farmGeo;
    } else {
      clicks = Math.floor(views * (0.014 + rand() * 0.012));
      geo = normalGeo;
    }

    series.push({ views, clicks, geo });
  }

  // Counters are monotonic — enforce it so deltas never go negative.
  for (let i = 1; i < series.length; i++) {
    series[i].views = Math.max(series[i].views, series[i - 1].views);
    series[i].clicks = Math.max(series[i].clicks, series[i - 1].clicks);
  }

  return series;
}

async function main() {
  console.log("Clearing existing data…");
  // Order matters: children before parents.
  await prisma.auditEvent.deleteMany();
  await prisma.fraudFlag.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.contentMetricSnapshot.deleteMany();
  await prisma.influencerApplication.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.socialAccount.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // --- admin --------------------------------------------------------------
  const admin = await prisma.user.create({
    data: {
      email: "admin@payloop.io",
      name: "Nadia Belkacem",
      passwordHash,
      role: Role.ADMIN,
      verification: VerificationStatus.VERIFIED,
      country: "DZ",
    },
  });

  // --- brands -------------------------------------------------------------
  const brandSpecs = [
    {
      email: "growth@atlasmobile.dz",
      name: "Yacine Haddad",
      companyName: "Atlas Mobile",
      website: "https://atlasmobile.dz",
      country: "DZ",
    },
    {
      email: "marketing@souqly.com",
      name: "Leïla Bensalah",
      companyName: "Souqly",
      website: "https://souqly.com",
      country: "DZ",
    },
    {
      email: "brand@nordfit.fr",
      name: "Camille Rousseau",
      companyName: "NordFit",
      website: "https://nordfit.fr",
      country: "FR",
    },
  ];

  const brands = [];
  for (const spec of brandSpecs) {
    brands.push(
      await prisma.user.create({
        data: {
          ...spec,
          passwordHash,
          role: Role.BRAND,
          verification: VerificationStatus.VERIFIED,
        },
      })
    );
  }

  // --- influencers --------------------------------------------------------
  const influencerSpecs = [
    { email: "amine@creators.dz", name: "Amine Zerrouki", handle: "aminezr", country: "DZ", followers: 412_000, verified: VerificationStatus.VERIFIED, stripe: StripeConnectStatus.VERIFIED },
    { email: "sara@creators.dz", name: "Sara Mansouri", handle: "saramns", country: "DZ", followers: 268_000, verified: VerificationStatus.VERIFIED, stripe: StripeConnectStatus.VERIFIED },
    { email: "karim@creators.dz", name: "Karim Bouaziz", handle: "karimbz", country: "DZ", followers: 156_000, verified: VerificationStatus.VERIFIED, stripe: StripeConnectStatus.VERIFIED },
    { email: "yasmine@creators.ma", name: "Yasmine Alaoui", handle: "yasminea", country: "MA", followers: 94_000, verified: VerificationStatus.VERIFIED, stripe: StripeConnectStatus.ONBOARDING },
    { email: "omar@creators.tn", name: "Omar Trabelsi", handle: "omartr", country: "TN", followers: 77_500, verified: VerificationStatus.PENDING, stripe: StripeConnectStatus.NONE },
    { email: "lina@creators.fr", name: "Lina Cherif", handle: "linach", country: "FR", followers: 331_000, verified: VerificationStatus.VERIFIED, stripe: StripeConnectStatus.VERIFIED },
    { email: "mehdi@creators.dz", name: "Mehdi Larbi", handle: "mehdilr", country: "DZ", followers: 48_200, verified: VerificationStatus.UNVERIFIED, stripe: StripeConnectStatus.NONE },
    { email: "nour@creators.dz", name: "Nour Sadaoui", handle: "noursd", country: "DZ", followers: 205_000, verified: VerificationStatus.VERIFIED, stripe: StripeConnectStatus.VERIFIED },
  ];

  const influencers = [];
  for (const [i, spec] of influencerSpecs.entries()) {
    const user = await prisma.user.create({
      data: {
        email: spec.email,
        name: spec.name,
        handle: spec.handle,
        country: spec.country,
        passwordHash,
        role: Role.INFLUENCER,
        verification: spec.verified,
        bio: `Creator based in ${spec.country}. Short-form video, lifestyle and tech.`,
        stripeConnectedStatus: spec.stripe,
        stripePayoutsEnabled: spec.stripe === StripeConnectStatus.VERIFIED,
        stripeAccountId:
          spec.stripe === StripeConnectStatus.NONE
            ? null
            : `acct_demo_${String(i + 1).padStart(4, "0")}`,
        // Placeholder tokens, encrypted through the same envelope production
        // uses — the sync job needs a decryptable token to treat the account as
        // connected. They are not real credentials and only work in mock mode.
        socialTokens: {
          TIKTOK: encryptJson({
            accessToken: `demo-tiktok-token-${i}`,
            refreshToken: `demo-tiktok-refresh-${i}`,
            platformUserId: `tt_open_${spec.handle}`,
            scope: "user.info.basic,user.info.stats,video.list",
          }),
        },
      },
    });

    // TikTok is the launch platform, so every creator has it linked; the other
    // two are sprinkled to exercise the multi-platform UI states.
    await prisma.socialAccount.create({
      data: {
        userId: user.id,
        platform: Platform.TIKTOK,
        platformUserId: `tt_open_${user.id.slice(-8)}`,
        username: spec.handle,
        displayName: spec.name,
        followerCount: spec.followers,
        scopes: ["user.info.basic", "user.info.stats", "video.list"],
        connectedAt: hoursAgo(400 + i * 40),
        lastSyncedAt: hoursAgo(1),
      },
    });

    if (i % 3 === 0) {
      await prisma.socialAccount.create({
        data: {
          userId: user.id,
          platform: Platform.INSTAGRAM,
          platformUserId: `ig_${user.id.slice(-8)}`,
          username: spec.handle,
          displayName: spec.name,
          followerCount: Math.floor(spec.followers * 0.55),
          connectedAt: hoursAgo(300),
          lastSyncedAt: hoursAgo(2),
        },
      });
    }
    if (i % 4 === 1) {
      await prisma.socialAccount.create({
        data: {
          userId: user.id,
          platform: Platform.YOUTUBE,
          platformUserId: `yt_${user.id.slice(-8)}`,
          username: `${spec.handle}TV`,
          displayName: `${spec.name} TV`,
          followerCount: Math.floor(spec.followers * 0.3),
          connectedAt: hoursAgo(250),
          lastSyncedAt: hoursAgo(3),
        },
      });
    }

    influencers.push(user);
  }

  // --- campaigns ----------------------------------------------------------
  const campaignSpecs = [
    {
      brand: brands[0],
      title: "Atlas Mobile — Ramadan Data Bundles",
      description:
        "Short-form video showing how the new 100GB Ramadan bundle works. Authentic, in-the-moment, no scripted voiceover.",
      brief:
        "Open with the problem (running out of data mid-call), demo the bundle activation in under 15s, close with the promo code. Arabic or Derja preferred.",
      pricingModel: PricingModel.CPM,
      cpmRate: 320, // $3.20 per 1k views
      cpcRate: 0,
      budgetCents: 850_000,
      platforms: [Platform.TIKTOK, Platform.INSTAGRAM],
      status: CampaignStatus.ACTIVE,
      startDate: hoursAgo(24 * 21),
      endDate: daysFromNow(18),
      hashtags: ["#AtlasMobile", "#Ramadan2026", "#DataBundle"],
      targetCountries: ["DZ"],
      minPayoutThresholdCents: 1000,
    },
    {
      brand: brands[1],
      title: "Souqly — Back to Campus Drop",
      description:
        "Drive signups for the student marketplace. Clicks matter more than reach here.",
      brief:
        "Show a real dorm/campus setting. Feature the student discount flow end to end. Link in bio must be the tracked link.",
      pricingModel: PricingModel.CPC,
      cpmRate: 0,
      cpcRate: 42, // $0.42 per click
      budgetCents: 420_000,
      platforms: [Platform.TIKTOK],
      status: CampaignStatus.ACTIVE,
      startDate: hoursAgo(24 * 14),
      endDate: daysFromNow(25),
      hashtags: ["#Souqly", "#BackToCampus"],
      targetCountries: ["DZ", "TN"],
      minPayoutThresholdCents: 1500,
    },
    {
      brand: brands[2],
      title: "NordFit — 30-Day Challenge Launch",
      description:
        "Hybrid campaign: paid on both reach and signups for the 30-day programme.",
      brief:
        "Day-1 vs day-30 framing. Show the app's streak screen. French or English.",
      pricingModel: PricingModel.HYBRID,
      cpmRate: 180,
      cpcRate: 25,
      budgetCents: 1_250_000,
      platforms: [Platform.TIKTOK, Platform.YOUTUBE, Platform.INSTAGRAM],
      status: CampaignStatus.ACTIVE,
      startDate: hoursAgo(24 * 30),
      endDate: daysFromNow(40),
      hashtags: ["#NordFit", "#30DayChallenge"],
      targetCountries: ["FR", "DZ", "MA"],
      minPayoutThresholdCents: 2000,
    },
    {
      brand: brands[0],
      title: "Atlas Mobile — 5G Coverage Reveal",
      description: "Awareness push for the 5G rollout across Algiers and Oran.",
      brief: "Speed-test format. Show real download numbers on camera.",
      pricingModel: PricingModel.CPM,
      cpmRate: 275,
      cpcRate: 0,
      budgetCents: 600_000,
      platforms: [Platform.TIKTOK, Platform.YOUTUBE],
      status: CampaignStatus.COMPLETED,
      startDate: hoursAgo(24 * 70),
      endDate: hoursAgo(24 * 6),
      hashtags: ["#Atlas5G"],
      targetCountries: ["DZ"],
      minPayoutThresholdCents: 1000,
    },
    {
      brand: brands[1],
      title: "Souqly — Seller Onboarding (Draft)",
      description:
        "Recruit small sellers onto the marketplace. Not live yet — pricing under review.",
      brief: "TBD",
      pricingModel: PricingModel.HYBRID,
      cpmRate: 150,
      cpcRate: 60,
      budgetCents: 300_000,
      platforms: [Platform.TIKTOK, Platform.INSTAGRAM],
      status: CampaignStatus.DRAFT,
      startDate: daysFromNow(7),
      endDate: daysFromNow(45),
      hashtags: ["#SellOnSouqly"],
      targetCountries: ["DZ"],
      minPayoutThresholdCents: 1000,
    },
  ];

  const campaigns = [];
  for (const spec of campaignSpecs) {
    const { brand, ...data } = spec;
    campaigns.push(
      await prisma.campaign.create({
        data: { ...data, brandId: brand.id, requirements: data.brief },
      })
    );
  }

  // --- applications, snapshots, payouts, flags ----------------------------
  type Plan = {
    campaign: (typeof campaigns)[number];
    influencer: (typeof influencers)[number];
    status: ApplicationStatus;
    profile?: GrowthProfile;
    ceiling?: number;
    hours?: number;
    paidOut?: boolean;
  };

  const plans: Plan[] = [
    // Ramadan bundles (CPM) — a healthy mix plus one purchased-views case.
    { campaign: campaigns[0], influencer: influencers[0], status: ApplicationStatus.APPROVED, profile: "viral", ceiling: 1_240_000, hours: 96, paidOut: true },
    { campaign: campaigns[0], influencer: influencers[1], status: ApplicationStatus.APPROVED, profile: "steady", ceiling: 386_000, hours: 96, paidOut: true },
    { campaign: campaigns[0], influencer: influencers[6], status: ApplicationStatus.APPROVED, profile: "botted", ceiling: 462_000, hours: 96 },
    { campaign: campaigns[0], influencer: influencers[3], status: ApplicationStatus.PENDING },
    { campaign: campaigns[0], influencer: influencers[4], status: ApplicationStatus.PENDING },

    // Back to Campus (CPC) — clicks are the metric; one click-farm case.
    { campaign: campaigns[1], influencer: influencers[2], status: ApplicationStatus.APPROVED, profile: "steady", ceiling: 214_000, hours: 72, paidOut: true },
    { campaign: campaigns[1], influencer: influencers[7], status: ApplicationStatus.APPROVED, profile: "click_farm", ceiling: 88_000, hours: 72 },
    { campaign: campaigns[1], influencer: influencers[4], status: ApplicationStatus.APPROVED, profile: "slow", ceiling: 41_000, hours: 72 },
    { campaign: campaigns[1], influencer: influencers[5], status: ApplicationStatus.REJECTED },

    // NordFit (hybrid).
    { campaign: campaigns[2], influencer: influencers[5], status: ApplicationStatus.APPROVED, profile: "viral", ceiling: 902_000, hours: 120, paidOut: true },
    { campaign: campaigns[2], influencer: influencers[3], status: ApplicationStatus.APPROVED, profile: "steady", ceiling: 173_000, hours: 120 },
    { campaign: campaigns[2], influencer: influencers[0], status: ApplicationStatus.APPROVED, profile: "steady", ceiling: 268_000, hours: 120, paidOut: true },
    { campaign: campaigns[2], influencer: influencers[6], status: ApplicationStatus.PENDING },

    // Completed 5G campaign — everyone paid out.
    { campaign: campaigns[3], influencer: influencers[1], status: ApplicationStatus.APPROVED, profile: "steady", ceiling: 520_000, hours: 120, paidOut: true },
    { campaign: campaigns[3], influencer: influencers[7], status: ApplicationStatus.APPROVED, profile: "slow", ceiling: 149_000, hours: 120, paidOut: true },
  ];

  let snapshotCount = 0;
  let payoutCount = 0;
  let flagCount = 0;

  // Mirrors calculateCappedEarnings(): a campaign can never accrue past its
  // budget, so each participant's ceiling is whatever headroom is left.
  const accruedByCampaign = new Map<string, number>();
  const headroomFor = (campaignId: string, budgetCents: number) =>
    Math.max(0, budgetCents - (accruedByCampaign.get(campaignId) ?? 0));

  for (const [idx, plan] of plans.entries()) {
    // Phase 1 is TikTok-only for tracking, so submitted content is always
    // TikTok even on campaigns that also target Instagram/YouTube. Creators
    // still have those accounts linked — they just can't be tracked yet.
    const platform = plan.campaign.platforms.includes(Platform.TIKTOK)
      ? Platform.TIKTOK
      : plan.campaign.platforms[0];
    const approved = plan.status === ApplicationStatus.APPROVED;

    const application = await prisma.influencerApplication.create({
      data: {
        campaignId: plan.campaign.id,
        influencerId: plan.influencer.id,
        status: plan.status,
        pitch:
          "I've run three campaigns in this category with strong completion rates. Happy to shoot two variants and let performance decide.",
        platform,
        reviewedAt: plan.status === ApplicationStatus.PENDING ? null : hoursAgo(200),
        rejectReason:
          plan.status === ApplicationStatus.REJECTED
            ? "Audience overlap with an existing partner on this campaign."
            : null,
        contentId: approved ? `${platform.toLowerCase()}_${7_400_000_000 + idx * 137}` : null,
        contentUrl: approved
          ? `https://www.tiktok.com/@${plan.influencer.handle}/video/${7_400_000_000 + idx * 137}`
          : null,
        postedAt: approved ? hoursAgo(plan.hours ?? 96) : null,
      },
    });

    if (!approved) continue;

    const hours = plan.hours ?? 96;
    const series = buildSeries(plan.profile ?? "steady", hours, plan.ceiling ?? 200_000);

    // One snapshot every 4 hours keeps the seed compact while leaving enough
    // consecutive points for the sustained-spike rule to have something to read.
    const step = 4;
    let previous = { views: 0, clicks: 0 };
    let last = series[0];

    const headroom = headroomFor(plan.campaign.id, plan.campaign.budgetCents);

    for (let h = 0; h <= hours; h += step) {
      const point = series[Math.min(h, series.length - 1)];
      const earnings = Math.min(
        headroom,
        earningsFor(
          plan.campaign.pricingModel,
          { cpmRate: plan.campaign.cpmRate, cpcRate: plan.campaign.cpcRate },
          point.views,
          point.clicks
        )
      );

      await prisma.contentMetricSnapshot.create({
        data: {
          applicationId: application.id,
          capturedAt: hoursAgo(hours - h),
          views: point.views,
          likes: Math.floor(point.views * 0.052),
          comments: Math.floor(point.views * 0.0031),
          shares: Math.floor(point.views * 0.0074),
          impressions: Math.floor(point.views * 1.24),
          reach: Math.floor(point.views * 0.88),
          clicks: point.clicks,
          viewsDelta: point.views - previous.views,
          clicksDelta: point.clicks - previous.clicks,
          geoDistribution: point.geo,
          earningsCents: earnings,
        },
      });

      previous = { views: point.views, clicks: point.clicks };
      last = point;
      snapshotCount++;
    }

    const totalEarnings = Math.min(
      headroom,
      earningsFor(
        plan.campaign.pricingModel,
        { cpmRate: plan.campaign.cpmRate, cpcRate: plan.campaign.cpcRate },
        last.views,
        last.clicks
      )
    );
    accruedByCampaign.set(
      plan.campaign.id,
      (accruedByCampaign.get(plan.campaign.id) ?? 0) + totalEarnings
    );

    const isFraudulent =
      plan.profile === "botted" || plan.profile === "click_farm";

    let paidOutCents = 0;
    let payoutStatus: PayoutStatus = PayoutStatus.NOT_ELIGIBLE;

    if (isFraudulent) {
      payoutStatus = PayoutStatus.HELD_FOR_REVIEW;
    } else if (plan.paidOut) {
      // Pay out most of the balance, leaving a realistic accrued remainder.
      paidOutCents = Math.floor(totalEarnings * 0.78);
      payoutStatus = PayoutStatus.PAID;
      payoutCount++;

      await prisma.payout.create({
        data: {
          applicationId: application.id,
          influencerId: plan.influencer.id,
          amountCents: paidOutCents,
          status: PayoutState.PAID,
          stripeTransferId: `tr_demo_${application.id.slice(-10)}`,
          stripeAccountId: plan.influencer.stripeAccountId,
          idempotencyKey: `payout_${application.id}_0_${paidOutCents}`,
          triggeredAt: hoursAgo(30),
          paidAt: hoursAgo(30),
        },
      });

      await prisma.auditEvent.create({
        data: {
          action: "payout.paid",
          entityType: "Payout",
          entityId: application.id,
          actorLabel: "system:cron",
          metadata: { amountCents: paidOutCents, applicationId: application.id },
          createdAt: hoursAgo(30),
        },
      });
    } else if (totalEarnings >= plan.campaign.minPayoutThresholdCents) {
      payoutStatus = PayoutStatus.PENDING;
    }

    await prisma.influencerApplication.update({
      where: { id: application.id },
      data: {
        views: last.views,
        clicks: last.clicks,
        likes: Math.floor(last.views * 0.052),
        comments: Math.floor(last.views * 0.0031),
        shares: Math.floor(last.views * 0.0074),
        impressions: Math.floor(last.views * 1.24),
        earningsCents: totalEarnings,
        paidOutCents,
        payoutStatus,
        lastSyncedAt: hoursAgo(1),
      },
    });

    // Flags carry the same evidence the live rules would attach.
    if (plan.profile === "botted") {
      await prisma.fraudFlag.create({
        data: {
          applicationId: application.id,
          reason: FraudReason.LOW_ENGAGEMENT_RATIO,
          severity: FraudSeverity.HIGH,
          detail: `${last.views.toLocaleString()} views produced only ${last.clicks} clicks — far below any plausible organic rate.`,
          evidence: {
            views: last.views,
            clicks: last.clicks,
            clickRate: last.clicks / Math.max(1, last.views),
            thresholdViews: 10_000,
            thresholdClicks: 10,
          },
          createdAt: hoursAgo(20),
        },
      });
      await prisma.fraudFlag.create({
        data: {
          applicationId: application.id,
          reason: FraudReason.GEO_CONCENTRATION,
          severity: FraudSeverity.MEDIUM,
          detail:
            "94.0% of the audience resolves to a single region (DZ), above the 70% threshold.",
          evidence: { topRegion: "DZ", topShare: 0.94, threshold: 0.7, distribution: last.geo },
          createdAt: hoursAgo(20),
        },
      });
      flagCount += 2;
    }

    if (plan.profile === "click_farm") {
      const ctr = last.clicks / Math.max(1, last.views);
      await prisma.fraudFlag.create({
        data: {
          applicationId: application.id,
          reason: FraudReason.CLICK_VIEW_ANOMALY,
          severity: FraudSeverity.CRITICAL,
          detail: `Click-through rate of ${(ctr * 100).toFixed(1)}% exceeds the 35% plausibility ceiling — clicks are outpacing views.`,
          evidence: { views: last.views, clicks: last.clicks, ctr, threshold: 0.35 },
          createdAt: hoursAgo(14),
        },
      });
      await prisma.fraudFlag.create({
        data: {
          applicationId: application.id,
          reason: FraudReason.GEO_CONCENTRATION,
          severity: FraudSeverity.HIGH,
          detail:
            "81.0% of the audience resolves to a single region (RU), above the 70% threshold.",
          evidence: { topRegion: "RU", topShare: 0.81, threshold: 0.7, distribution: last.geo },
          createdAt: hoursAgo(14),
        },
      });
      flagCount += 2;
    }
  }

  // One historical, already-resolved flag so the "resolved" tab isn't empty.
  const firstApproved = await prisma.influencerApplication.findFirst({
    where: { status: ApplicationStatus.APPROVED },
  });
  if (firstApproved) {
    await prisma.fraudFlag.create({
      data: {
        applicationId: firstApproved.id,
        reason: FraudReason.SPIKE_ANOMALY,
        severity: FraudSeverity.MEDIUM,
        detail:
          "View count grew more than 400% per hour across 3 consecutive snapshots (peak 6.1×).",
        evidence: { sustainedSnapshots: 3, threshold: 5, note: "Coincided with a verified duet from a 4M-follower account." },
        resolvedById: admin.id,
        resolvedAt: hoursAgo(48),
        resolution: "CLEARED",
        resolverNote:
          "Genuine virality — traced to a duet by @tech_dz. Payout released.",
        createdAt: hoursAgo(52),
      },
    });
    flagCount++;
  }

  // Roll campaign spend up from what participants actually accrued.
  for (const campaign of campaigns) {
    const agg = await prisma.influencerApplication.aggregate({
      where: { campaignId: campaign.id, status: ApplicationStatus.APPROVED },
      _sum: { earningsCents: true },
    });
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { spentCents: agg._sum.earningsCents ?? 0 },
    });
  }

  const totals = await prisma.influencerApplication.aggregate({
    _sum: { earningsCents: true, views: true },
  });

  console.log(`
Seed complete.

  admin        1   admin@payloop.io
  brands       ${brands.length}   ${brandSpecs.map((b) => b.companyName).join(", ")}
  influencers  ${influencers.length}
  campaigns    ${campaigns.length}
  applications ${plans.length}
  snapshots    ${snapshotCount}
  payouts      ${payoutCount}
  fraud flags  ${flagCount}

  total views    ${(totals._sum.views ?? 0).toLocaleString()}
  total accrued  $${((totals._sum.earningsCents ?? 0) / 100).toFixed(2)}

  Every account signs in with password: ${PASSWORD}
`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
