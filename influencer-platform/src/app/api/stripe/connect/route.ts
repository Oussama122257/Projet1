import { fail, handler, ok } from "@/lib/api";
import { env, flags } from "@/lib/env";
import { requireUser } from "@/lib/session";
import { getCurrentUserRecord } from "@/lib/session";
import {
  createOnboardingLink,
  syncConnectStatus,
} from "@/services/paymentService";

/**
 * POST /api/stripe/connect — start or resume Stripe Connect onboarding.
 *
 * Returns a single-use Stripe-hosted onboarding URL. Express accounts mean
 * Stripe collects the identity and bank details directly, so PayLoop never
 * touches them.
 */
export const POST = handler(async () => {
  await requireUser();
  const user = await getCurrentUserRecord();
  if (!user) return fail("Account not found", 404);

  if (!flags.stripeReady) {
    return fail(
      "Payouts are not configured on this deployment (STRIPE_SECRET_KEY is unset)",
      503
    );
  }

  const base = env.NEXT_PUBLIC_APP_URL;
  const url = await createOnboardingLink(
    user,
    `${base}/influencer/payouts?onboarding=complete`,
    `${base}/influencer/payouts?onboarding=refresh`
  );

  return ok({ url });
});

/** GET /api/stripe/connect — current Connect status, refreshed from Stripe. */
export const GET = handler(async () => {
  await requireUser();
  const user = await getCurrentUserRecord();
  if (!user) return fail("Account not found", 404);

  if (!flags.stripeReady || !user.stripeAccountId) {
    return ok({
      status: user.stripeConnectedStatus,
      payoutsEnabled: false,
      configured: flags.stripeReady,
    });
  }

  const result = await syncConnectStatus(user);
  return ok({ ...result, configured: true });
});
