import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ExternalLink, Wallet } from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { Stat } from "@/components/ui/stat";
import { PayoutStatePill } from "@/components/status";
import { StripeOnboarding } from "@/components/influencer/stripe-onboarding";
import { prisma, PayoutState } from "@/lib/db";
import { flags } from "@/lib/env";
import { getCurrentUser } from "@/lib/session";
import { formatDateTime, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Payouts" };

export default async function PayoutsPage({
  searchParams,
}: {
  searchParams: { onboarding?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [account, payouts, applications] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        stripeAccountId: true,
        stripeConnectedStatus: true,
        stripePayoutsEnabled: true,
        country: true,
      },
    }),
    prisma.payout.findMany({
      where: { influencerId: user.id },
      include: {
        application: {
          select: {
            contentUrl: true,
            campaign: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.influencerApplication.findMany({
      where: { influencerId: user.id },
      select: { earningsCents: true, paidOutCents: true },
    }),
  ]);

  const totalEarned = applications.reduce((s, a) => s + a.earningsCents, 0);
  const totalPaid = payouts
    .filter((p) => p.status === PayoutState.PAID)
    .reduce((s, p) => s + p.amountCents, 0);
  const pending = Math.max(0, totalEarned - totalPaid);

  return (
    <PageBody>
      <PageHeader
        title="Payouts"
        description="Transfers land in your own Stripe account. Every one is recorded here with a receipt you can reconcile against."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Lifetime earned" value={totalEarned} format="money" />
        <Stat
          label="Transferred to you"
          value={totalPaid}
          format="money"
          icon={Wallet}
          accent
        />
        <Stat
          label="Awaiting transfer"
          value={pending}
          format="money"
          hint="Released once each campaign's threshold is met"
        />
      </div>

      <div className="mt-6">
        <StripeOnboarding
          status={account?.stripeConnectedStatus ?? "NONE"}
          payoutsEnabled={Boolean(account?.stripePayoutsEnabled)}
          hasAccount={Boolean(account?.stripeAccountId)}
          stripeConfigured={flags.stripeReady}
          onboardingResult={searchParams.onboarding}
        />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-lg font-medium tracking-[-0.01em] text-ink">
          Payout history
        </h2>

        <div className="mt-4">
          {payouts.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No payouts yet"
              description="Once your earnings on a campaign clear its payout threshold and your Stripe account is verified, the transfer runs automatically and shows up here."
              compact
            />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-surface-raised">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[46rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-4 py-3 text-xs font-medium text-ink-tertiary">
                        Campaign
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-ink-tertiary">
                        Date
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-ink-tertiary">
                        Status
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-ink-tertiary">
                        Receipt
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-ink-tertiary">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((payout) => (
                      <tr
                        key={payout.id}
                        className="border-b border-border/60 last:border-0 hover:bg-surface-overlay/50"
                      >
                        <td className="px-4 py-3 text-ink">
                          {payout.application.campaign.title}
                        </td>
                        <td className="px-4 py-3 text-ink-secondary">
                          {formatDateTime(payout.paidAt ?? payout.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <PayoutStatePill status={payout.status} />
                          {payout.failureReason && (
                            <p className="mt-1 max-w-xs text-xs text-danger">
                              {payout.failureReason}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {payout.stripeTransferId ? (
                            <a
                              href={`https://dashboard.stripe.com/transfers/${payout.stripeTransferId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                            >
                              {payout.stripeTransferId.slice(0, 18)}…
                              <ExternalLink className="size-3" aria-hidden />
                            </a>
                          ) : (
                            <span className="text-xs text-ink-tertiary">—</span>
                          )}
                        </td>
                        <td className="tabular px-4 py-3 text-right font-medium text-ink">
                          {formatMoney(payout.amountCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
    </PageBody>
  );
}
