import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { recordAudit } from "@/lib/audit";
import { prisma, PayoutState, PayoutStatus, StripeConnectStatus } from "@/lib/db";
import { env, flags } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { getStripe } from "@/services/paymentService";

const log = createLogger("stripe:webhook");

/**
 * Stripe webhook receiver.
 *
 * Signature verification is mandatory — without it anyone could POST a
 * "transfer.paid" event and mark payouts settled. The raw body is required for
 * that check, so this route must never parse JSON first.
 */
export async function POST(req: Request) {
  if (!flags.stripeReady || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: { message: "Stripe webhooks are not configured" } },
      { status: 503 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: { message: "Missing stripe-signature header" } },
      { status: 400 }
    );
  }

  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      raw,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    log.warn("signature verification failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: { message: "Invalid signature" } },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      // Connected account finished (or changed) onboarding.
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const user = await prisma.user.findFirst({
          where: { stripeAccountId: account.id },
        });
        if (!user) break;

        const payoutsEnabled = Boolean(account.payouts_enabled);
        const status = account.requirements?.disabled_reason
          ? StripeConnectStatus.RESTRICTED
          : payoutsEnabled && account.capabilities?.transfers === "active"
            ? StripeConnectStatus.VERIFIED
            : StripeConnectStatus.ONBOARDING;

        await prisma.user.update({
          where: { id: user.id },
          data: { stripeConnectedStatus: status, stripePayoutsEnabled: payoutsEnabled },
        });

        await recordAudit({
          action: "stripe.account_updated",
          entityType: "User",
          entityId: user.id,
          actorLabel: "system:stripe",
          metadata: { status, payoutsEnabled },
        });
        break;
      }

      // A transfer we created was reversed — the money came back, so the
      // application's paid-out watermark must come back down with it.
      case "transfer.reversed": {
        const transfer = event.data.object as Stripe.Transfer;
        const payout = await prisma.payout.findUnique({
          where: { stripeTransferId: transfer.id },
        });
        if (!payout) break;

        await prisma.$transaction([
          prisma.payout.update({
            where: { id: payout.id },
            data: {
              status: PayoutState.FAILED,
              failureReason: "Transfer reversed by Stripe",
              failedAt: new Date(),
            },
          }),
          prisma.influencerApplication.update({
            where: { id: payout.applicationId },
            data: {
              paidOutCents: { decrement: payout.amountCents },
              payoutStatus: PayoutStatus.FAILED,
            },
          }),
        ]);

        await recordAudit({
          action: "payout.reversed",
          entityType: "Payout",
          entityId: payout.id,
          actorLabel: "system:stripe",
          metadata: { transferId: transfer.id, amountCents: payout.amountCents },
        });
        break;
      }

      default:
        log.debug("unhandled event", { type: event.type });
    }
  } catch (err) {
    log.error("webhook handling failed", {
      type: event.type,
      error: err instanceof Error ? err.message : String(err),
    });
    // 500 tells Stripe to retry; the handlers above are idempotent.
    return NextResponse.json(
      { error: { message: "Handler failed" } },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
