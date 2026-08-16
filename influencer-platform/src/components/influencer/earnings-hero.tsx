import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Counter } from "@/components/ui/counter";
import { ConnectStatusPill } from "@/components/status";
import type { StripeConnectStatus } from "@prisma/client";
import { formatMoney } from "@/lib/utils";

/**
 * The number creators actually open the app for.
 *
 * Total earned counts up on load; the two supporting figures stay static so the
 * eye lands on the headline first. Next payout date is stated explicitly because
 * "when do I get paid" is the question behind the visit.
 */
export function EarningsHero({
  totalEarnedCents,
  paidOutCents,
  pendingCents,
  payoutsEnabled,
  connectStatus,
}: {
  totalEarnedCents: number;
  paidOutCents: number;
  pendingCents: number;
  payoutsEnabled: boolean;
  connectStatus: StripeConnectStatus;
}) {
  // Payout runs are hourly; the next one is the top of the coming hour.
  const nextRun = new Date();
  nextRun.setMinutes(0, 0, 0);
  nextRun.setHours(nextRun.getHours() + 1);

  return (
    <div className="relative overflow-hidden rounded-lg border border-accent/25 bg-surface-raised shadow-card">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(36rem 18rem at 15% 0%, rgba(178,92,255,0.13), transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="eyebrow">Total earned</p>
          <p className="mt-2 font-display text-[2.75rem] font-semibold leading-none tracking-[-0.03em] text-accent">
            <Counter
              value={totalEarnedCents}
              format="money"
              compact={false}
              duration={1.3}
            />
          </p>

          <div className="mt-6 grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-ink-tertiary">Paid out</p>
              <p className="tabular mt-1 font-display text-lg font-medium text-ink">
                {formatMoney(paidOutCents)}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-tertiary">Pending payout</p>
              <p className="tabular mt-1 font-display text-lg font-medium text-ink">
                {formatMoney(pendingCents)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-5 rounded-md border border-border bg-surface-overlay/60 p-5">
          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[0.8125rem] font-medium text-ink">
                Payout account
              </p>
              <ConnectStatusPill status={connectStatus} />
            </div>

            {payoutsEnabled ? (
              <p className="mt-2.5 flex items-start gap-2 text-xs leading-relaxed text-ink-secondary">
                <ShieldCheck
                  className="mt-0.5 size-3.5 shrink-0 text-success"
                  aria-hidden
                />
                Your Stripe account is verified. Earnings above each
                campaign&apos;s threshold transfer automatically.
              </p>
            ) : (
              <p className="mt-2.5 text-xs leading-relaxed text-ink-secondary">
                Connect a Stripe account to receive transfers. Your earnings keep
                accruing in the meantime — nothing is lost.
              </p>
            )}
          </div>

          <div>
            <p className="text-xs text-ink-tertiary">Next payout run</p>
            <p className="tabular mt-1 text-sm text-ink">
              {new Intl.DateTimeFormat("en-US", {
                hour: "numeric",
                minute: "2-digit",
                month: "short",
                day: "numeric",
              }).format(nextRun)}
            </p>

            <Button
              asChild
              variant={payoutsEnabled ? "secondary" : "primary"}
              size="sm"
              className="mt-3 w-full"
            >
              <Link href="/influencer/payouts">
                {payoutsEnabled ? "View payouts" : "Set up payouts"}
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
