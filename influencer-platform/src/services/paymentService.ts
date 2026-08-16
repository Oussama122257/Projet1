import Stripe from "stripe";
import {
  prisma,
  type Campaign,
  type InfluencerApplication,
  type User,
  PayoutState,
  PayoutStatus,
  PricingModel,
  StripeConnectStatus,
} from "@/lib/db";
import { env, flags } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";

const log = createLogger("payments");

let stripeClient: Stripe | null = null;

/**
 * Influencers are third parties being paid out, not customers being charged, so
 * this is Stripe Connect (connected accounts + transfers) rather than
 * PaymentIntents. Each influencer owns an Express account; we transfer from the
 * platform balance to that account.
 */
export function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured — payouts are disabled. " +
        "Set it in .env to enable Connect onboarding and transfers."
    );
  }
  if (!stripeClient) {
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
      appInfo: { name: "PayLoop", version: "0.1.0" },
      maxNetworkRetries: 2,
    });
  }
  return stripeClient;
}

// ---------------------------------------------------------------------------
// Earnings
// ---------------------------------------------------------------------------

export type EarningsInput = {
  views: number;
  clicks: number;
};

export type EarningsBreakdown = {
  /** Total gross earnings accrued to date, in cents. */
  totalCents: number;
  cpmCents: number;
  cpcCents: number;
  model: PricingModel;
};

/**
 * Gross earnings for an application, in integer cents.
 *
 * CPM rate is cents per 1,000 views; CPC rate is cents per click. Rounding is
 * floor-based so we never transfer more than was actually earned — the
 * fractional remainder simply accrues into the next sync.
 */
export function calculateEarnings(
  app: EarningsInput,
  pricingModel: PricingModel,
  rates: { cpmRate: number; cpcRate: number }
): EarningsBreakdown {
  const views = Math.max(0, Math.trunc(app.views));
  const clicks = Math.max(0, Math.trunc(app.clicks));

  const cpmCents =
    pricingModel === PricingModel.CPM || pricingModel === PricingModel.HYBRID
      ? Math.floor((views * rates.cpmRate) / 1000)
      : 0;

  const cpcCents =
    pricingModel === PricingModel.CPC || pricingModel === PricingModel.HYBRID
      ? clicks * rates.cpcRate
      : 0;

  return {
    totalCents: cpmCents + cpcCents,
    cpmCents,
    cpcCents,
    model: pricingModel,
  };
}

/**
 * Earnings capped by what remains of the campaign budget.
 *
 * A viral post must never overdraw the brand's budget: the campaign's remaining
 * headroom (budget minus what other participants already accrued) is the ceiling.
 */
export function calculateCappedEarnings(
  app: EarningsInput,
  campaign: Pick<
    Campaign,
    "pricingModel" | "cpmRate" | "cpcRate" | "budgetCents"
  >,
  otherParticipantsEarnedCents: number
): EarningsBreakdown & { cappedCents: number; wasCapped: boolean } {
  const gross = calculateEarnings(app, campaign.pricingModel, {
    cpmRate: campaign.cpmRate,
    cpcRate: campaign.cpcRate,
  });

  const headroom = Math.max(
    0,
    campaign.budgetCents - otherParticipantsEarnedCents
  );
  const capped = Math.min(gross.totalCents, headroom);

  return {
    ...gross,
    cappedCents: capped,
    wasCapped: capped < gross.totalCents,
  };
}

// ---------------------------------------------------------------------------
// Stripe Connect onboarding
// ---------------------------------------------------------------------------

export async function createConnectAccount(user: User): Promise<string> {
  const stripe = getStripe();

  if (user.stripeAccountId) return user.stripeAccountId;

  const account = await stripe.accounts.create({
    type: "express",
    email: user.email,
    country: user.country ?? "US",
    capabilities: { transfers: { requested: true } },
    business_type: "individual",
    metadata: { payloopUserId: user.id },
    settings: {
      payouts: { schedule: { interval: "daily" } },
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeAccountId: account.id,
      stripeConnectedStatus: StripeConnectStatus.ONBOARDING,
    },
  });

  await recordAudit({
    action: "stripe.account_created",
    entityType: "User",
    entityId: user.id,
    actorId: user.id,
    metadata: { stripeAccountId: account.id },
  });

  return account.id;
}

export async function createOnboardingLink(
  user: User,
  returnUrl: string,
  refreshUrl: string
): Promise<string> {
  const stripe = getStripe();
  const accountId = await createConnectAccount(user);

  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    return_url: returnUrl,
    refresh_url: refreshUrl,
  });

  return link.url;
}

/** Pull the live capability state from Stripe and mirror it locally. */
export async function syncConnectStatus(user: User): Promise<{
  status: StripeConnectStatus;
  payoutsEnabled: boolean;
}> {
  if (!user.stripeAccountId) {
    return { status: StripeConnectStatus.NONE, payoutsEnabled: false };
  }

  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(user.stripeAccountId);

  const payoutsEnabled = Boolean(account.payouts_enabled);
  const transfersActive = account.capabilities?.transfers === "active";

  let status: StripeConnectStatus;
  if (account.requirements?.disabled_reason) {
    status = StripeConnectStatus.RESTRICTED;
  } else if (payoutsEnabled && transfersActive) {
    status = StripeConnectStatus.VERIFIED;
  } else {
    status = StripeConnectStatus.ONBOARDING;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeConnectedStatus: status, stripePayoutsEnabled: payoutsEnabled },
  });

  return { status, payoutsEnabled };
}

// ---------------------------------------------------------------------------
// Payouts
// ---------------------------------------------------------------------------

export type PayoutResult =
  | { ok: true; payoutId: string; transferId: string | null; amountCents: number }
  | { ok: false; reason: string; payoutId?: string };

export function canReceivePayouts(user: {
  stripeAccountId: string | null;
  stripeConnectedStatus: StripeConnectStatus;
  stripePayoutsEnabled: boolean;
}): boolean {
  return (
    Boolean(user.stripeAccountId) &&
    user.stripeConnectedStatus === StripeConnectStatus.VERIFIED &&
    user.stripePayoutsEnabled
  );
}

/**
 * Transfer an influencer's unpaid balance for one application.
 *
 * Every stage writes an audit row, and the Payout row is created *before* the
 * Stripe call with a deterministic idempotency key — if the process dies
 * mid-transfer, the record exists and the retry cannot double-pay.
 */
export async function payInfluencer(
  application: InfluencerApplication & { influencer: User },
  amountCents: number,
  opts: { actorId?: string; reason?: string } = {}
): Promise<PayoutResult> {
  const { influencer } = application;

  if (amountCents <= 0) {
    return { ok: false, reason: "Nothing owed" };
  }

  if (!canReceivePayouts(influencer)) {
    return {
      ok: false,
      reason: `Stripe account not ready (status: ${influencer.stripeConnectedStatus})`,
    };
  }

  // Keyed on the cumulative paid-out watermark, so a retry of the *same*
  // accrual reuses the key while a genuinely new accrual gets a fresh one.
  const idempotencyKey = `payout_${application.id}_${application.paidOutCents}_${amountCents}`;

  const existing = await prisma.payout.findUnique({ where: { idempotencyKey } });
  if (existing && existing.status === PayoutState.PAID) {
    return {
      ok: true,
      payoutId: existing.id,
      transferId: existing.stripeTransferId,
      amountCents: existing.amountCents,
    };
  }

  const payout =
    existing ??
    (await prisma.payout.create({
      data: {
        applicationId: application.id,
        influencerId: influencer.id,
        amountCents,
        status: PayoutState.PENDING,
        stripeAccountId: influencer.stripeAccountId,
        idempotencyKey,
      },
    }));

  await recordAudit({
    action: "payout.initiated",
    entityType: "Payout",
    entityId: payout.id,
    actorId: opts.actorId,
    actorLabel: opts.actorId ? "user" : "system:cron",
    metadata: {
      applicationId: application.id,
      amountCents,
      reason: opts.reason ?? "threshold_met",
    },
  });

  try {
    const stripe = getStripe();
    const transfer = await stripe.transfers.create(
      {
        amount: amountCents,
        currency: "usd",
        destination: influencer.stripeAccountId!,
        description: `PayLoop earnings — application ${application.id}`,
        metadata: {
          payloopPayoutId: payout.id,
          applicationId: application.id,
          influencerId: influencer.id,
        },
      },
      { idempotencyKey }
    );

    const [updatedPayout] = await prisma.$transaction([
      prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: PayoutState.PAID,
          stripeTransferId: transfer.id,
          paidAt: new Date(),
        },
      }),
      prisma.influencerApplication.update({
        where: { id: application.id },
        data: {
          paidOutCents: { increment: amountCents },
          payoutStatus: PayoutStatus.PAID,
        },
      }),
    ]);

    await recordAudit({
      action: "payout.paid",
      entityType: "Payout",
      entityId: payout.id,
      actorId: opts.actorId,
      metadata: { transferId: transfer.id, amountCents },
    });

    log.info("payout completed", {
      payoutId: updatedPayout.id,
      amountCents,
      transferId: transfer.id,
    });

    return {
      ok: true,
      payoutId: updatedPayout.id,
      transferId: transfer.id,
      amountCents,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: PayoutState.FAILED,
        failureReason: message.slice(0, 500),
        failedAt: new Date(),
      },
    });
    await prisma.influencerApplication.update({
      where: { id: application.id },
      data: { payoutStatus: PayoutStatus.FAILED },
    });

    await recordAudit({
      action: "payout.failed",
      entityType: "Payout",
      entityId: payout.id,
      actorId: opts.actorId,
      metadata: { error: message.slice(0, 500), amountCents },
    });

    log.error("payout failed", { payoutId: payout.id, error: message });
    return { ok: false, reason: message, payoutId: payout.id };
  }
}

/** Unpaid balance for an application, in cents. */
export function outstandingBalance(
  app: Pick<InfluencerApplication, "earningsCents" | "paidOutCents">
): number {
  return Math.max(0, app.earningsCents - app.paidOutCents);
}

export function isPayoutsConfigured(): boolean {
  return flags.stripeReady;
}
