import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { Stat } from "@/components/ui/stat";
import { PayoutStatePill } from "@/components/status";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatDateTime, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Spend" };

export default async function SpendPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [campaigns, payouts] = await Promise.all([
    prisma.campaign.findMany({
      where: { brandId: user.id },
      select: {
        id: true,
        title: true,
        budgetCents: true,
        spentCents: true,
        status: true,
      },
      orderBy: { spentCents: "desc" },
    }),
    prisma.payout.findMany({
      where: { application: { campaign: { brandId: user.id } } },
      include: {
        influencer: { select: { name: true, handle: true, image: true } },
        application: {
          select: { campaign: { select: { id: true, title: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const committed = campaigns.reduce((s, c) => s + c.budgetCents, 0);
  const accrued = campaigns.reduce((s, c) => s + c.spentCents, 0);
  const transferred = payouts
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + p.amountCents, 0);

  return (
    <PageBody>
      <PageHeader
        title="Spend"
        description="What you've committed, what creators have accrued, and what has actually left the account."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Committed budget"
          value={committed}
          format="money"
          hint={`${campaigns.length} campaign${campaigns.length === 1 ? "" : "s"}`}
        />
        <Stat
          label="Accrued to creators"
          value={accrued}
          format="money"
          icon={Wallet}
          hint={
            committed > 0
              ? `${((accrued / committed) * 100).toFixed(1)}% of budget`
              : undefined
          }
        />
        <Stat
          label="Transferred"
          value={transferred}
          format="money"
          accent
          hint="Settled through Stripe Connect"
        />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-lg font-medium tracking-[-0.01em] text-ink">
          Budget by campaign
        </h2>
        <div className="mt-4 space-y-3">
          {campaigns.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No spend yet"
              description="Once a campaign is live and creators are posting, budget consumption shows up here."
              compact
            />
          ) : (
            campaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/brand/campaigns/${campaign.id}`}
                className="block rounded-lg border border-border bg-surface-raised p-4 transition-colors hover:border-ink-tertiary/40"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="truncate text-sm font-medium text-ink">
                    {campaign.title}
                  </span>
                  <span className="tabular shrink-0 text-sm text-ink-secondary">
                    <span className="font-medium text-ink">
                      {formatMoney(campaign.spentCents)}
                    </span>{" "}
                    / {formatMoney(campaign.budgetCents)}
                  </span>
                </div>
                <Progress
                  className="mt-3"
                  value={campaign.spentCents}
                  max={campaign.budgetCents}
                />
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-medium tracking-[-0.01em] text-ink">
          Payouts to your creators
        </h2>
        <div className="mt-4">
          {payouts.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No payouts yet"
              description="When a creator crosses their campaign's payout threshold, the transfer is recorded here."
              compact
            />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-surface-raised">
              {payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex flex-wrap items-center gap-4 border-b border-border/60 px-4 py-3.5 last:border-0"
                >
                  <Avatar
                    name={payout.influencer.name ?? "Creator"}
                    src={payout.influencer.image}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">
                      {payout.influencer.name}
                    </p>
                    <p className="truncate text-xs text-ink-tertiary">
                      {payout.application.campaign.title}
                    </p>
                  </div>
                  <span className="text-xs text-ink-tertiary">
                    {formatDateTime(payout.paidAt ?? payout.createdAt)}
                  </span>
                  <PayoutStatePill status={payout.status} />
                  <span className="tabular w-24 text-right text-sm font-medium text-ink">
                    {formatMoney(payout.amountCents)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </PageBody>
  );
}
