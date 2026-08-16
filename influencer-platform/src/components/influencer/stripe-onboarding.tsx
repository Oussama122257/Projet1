"use client";

import * as React from "react";
import { AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConnectStatusPill } from "@/components/status";
import type { StripeConnectStatus } from "@prisma/client";

/**
 * Stripe Connect onboarding.
 *
 * PayLoop never collects bank details or identity documents — the button hands
 * off to Stripe's hosted flow and we only mirror back the resulting capability
 * state.
 */
export function StripeOnboarding({
  status,
  payoutsEnabled,
  hasAccount,
  stripeConfigured,
  onboardingResult,
}: {
  status: StripeConnectStatus;
  payoutsEnabled: boolean;
  hasAccount: boolean;
  stripeConfigured: boolean;
  onboardingResult?: string;
}) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function startOnboarding() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/stripe/connect", { method: "POST" });
    const body = await res.json();

    if (!res.ok) {
      setError(body?.error?.message ?? "Could not start Stripe onboarding");
      setLoading(false);
      return;
    }

    window.location.href = body.data.url;
  }

  if (payoutsEnabled) {
    return (
      <Card className="flex flex-wrap items-center gap-4 border-success/25 p-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-success/25 bg-success-muted">
          <ShieldCheck className="size-4 text-success" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[0.9375rem] font-medium text-ink">
            Payouts are enabled
          </p>
          <p className="mt-0.5 text-sm text-ink-secondary">
            Earnings above each campaign&apos;s threshold transfer automatically
            on the hourly run.
          </p>
        </div>
        <ConnectStatusPill status={status} />
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="font-display text-[0.9375rem] font-medium text-ink">
              Set up your payout account
            </p>
            <ConnectStatusPill status={status} />
          </div>

          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-secondary">
            {!stripeConfigured
              ? "Payouts aren't configured on this deployment yet. Your earnings still accrue and will be transferable once Stripe keys are added."
              : status === "RESTRICTED"
                ? "Stripe has restricted transfers on your account. Open the onboarding flow to see what's outstanding."
                : hasAccount
                  ? "Your Stripe account exists but isn't finished. Complete the remaining steps to start receiving transfers."
                  : "Connect a Stripe account so we can send your earnings. Stripe collects your details directly — we never see your bank information."}
          </p>

          {onboardingResult === "complete" && (
            <p className="mt-3 text-xs text-ink-tertiary">
              Stripe sent you back. Verification can take a few minutes to
              propagate — refresh this page if the status hasn&apos;t updated yet.
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="mt-3 flex items-start gap-2 text-xs text-danger"
            >
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {error}
            </p>
          )}
        </div>

        <Button
          onClick={startOnboarding}
          loading={loading}
          disabled={!stripeConfigured}
        >
          {hasAccount ? "Continue setup" : "Connect Stripe"}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </Card>
  );
}
