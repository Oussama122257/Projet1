import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Compass, Eye, MousePointerClick, TrendingUp, Wallet } from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/app-shell";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Stat } from "@/components/ui/stat";
import { EarningsHero } from "@/components/influencer/earnings-hero";
import { ActiveCampaignCard } from "@/components/influencer/active-campaign-card";
import { prisma, ApplicationStatus, PayoutState } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Earnings" };

export default async function InfluencerHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [applications, payouts, account] = await Promise.all([
    prisma.influencerApplication.findMany({
      where: { influencerId: user.id },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            pricingModel: true,
            cpmRate: true,
            cpcRate: true,
            minPayoutThresholdCents: true,
            status: true,
            endDate: true,
            brand: { select: { name: true, companyName: true } },
          },
        },
        snapshots: {
          orderBy: { capturedAt: "asc" },
          select: {
            capturedAt: true,
            views: true,
            clicks: true,
            earningsCents: true,
          },
        },
        fraudFlags: { where: { resolvedAt: null }, select: { id: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.payout.findMany({
      where: { influencerId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        stripeConnectedStatus: true,
        stripePayoutsEnabled: true,
      },
    }),
  ]);

  const approved = applications.filter(
    (a) => a.status === ApplicationStatus.APPROVED
  );

  const totalEarned = approved.reduce((s, a) => s + a.earningsCents, 0);
  const totalPaid = payouts
    .filter((p) => p.status === PayoutState.PAID)
    .reduce((s, p) => s + p.amountCents, 0);
  const pendingBalance = Math.max(0, totalEarned - totalPaid);

  const totals = approved.reduce(
    (acc, a) => ({
      views: acc.views + a.views,
      clicks: acc.clicks + a.clicks,
    }),
    { views: 0, clicks: 0 }
  );

  // Combined earnings curve across every campaign the creator is in.
  const latest = new Map<string, { views: number; clicks: number; earningsCents: number }>();
  const buckets = new Map<number, { views: number; clicks: number; earningsCents: number }>();

  const flat = approved
    .flatMap((a) => a.snapshots.map((s) => ({ ...s, appId: a.id })))
    .sort((a, b) => a.capturedAt.getTime() - b.capturedAt.getTime());

  for (const snap of flat) {
    latest.set(snap.appId, {
      views: snap.views,
      clicks: snap.clicks,
      earningsCents: snap.earningsCents,
    });
    const hour = Math.floor(snap.capturedAt.getTime() / 3_600_000) * 3_600_000;
    const agg = [...latest.values()].reduce(
      (acc, v) => ({
        views: acc.views + v.views,
        clicks: acc.clicks + v.clicks,
        earningsCents: acc.earningsCents + v.earningsCents,
      }),
      { views: 0, clicks: 0, earningsCents: 0 }
    );
    buckets.set(hour, agg);
  }

  const series = [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([ts, v]) => ({ capturedAt: new Date(ts), ...v }));

  const live = approved.filter((a) => a.contentId);

  return (
    <PageBody>
      <PageHeader
        eyebrow="Your earnings"
        title={`Hey ${user.name?.split(" ")[0] ?? "there"}`}
        description="Updated every hour straight from the platform APIs. No invoices, no chasing."
        actions={
          <Button asChild variant="secondary">
            <Link href="/influencer/campaigns">
              <Compass className="size-4" />
              Find campaigns
            </Link>
          </Button>
        }
      />

      <div className="mt-8">
        <EarningsHero
          totalEarnedCents={totalEarned}
          paidOutCents={totalPaid}
          pendingCents={pendingBalance}
          payoutsEnabled={Boolean(account?.stripePayoutsEnabled)}
          connectStatus={account?.stripeConnectedStatus ?? "NONE"}
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Total views"
          value={totals.views}
          icon={Eye}
          trend={series.slice(-16).map((s) => s.views)}
        />
        <Stat
          label="Total clicks"
          value={totals.clicks}
          icon={MousePointerClick}
          trend={series.slice(-16).map((s) => s.clicks)}
        />
        <Stat
          label="Campaigns live"
          value={live.length}
          icon={TrendingUp}
          hint={`${applications.length} application${applications.length === 1 ? "" : "s"} total`}
        />
      </div>

      {series.length > 1 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Your performance</CardTitle>
            <p className="text-sm text-ink-secondary">
              Cumulative views and earnings across every campaign you&apos;re in.
            </p>
          </CardHeader>
          <CardContent>
            <PerformanceChart data={series} height={280} />
          </CardContent>
        </Card>
      )}

      <section className="mt-10">
        <h2 className="font-display text-lg font-medium tracking-[-0.01em] text-ink">
          Active campaigns
        </h2>
        <p className="mt-1 text-sm text-ink-secondary">
          Live counters and how close each one is to its next payout.
        </p>

        <div className="mt-4">
          {live.length === 0 ? (
            <EmptyState
              icon={Compass}
              title="Nothing live yet"
              description="Apply to a campaign, get approved, then link the content you post. Earnings start accruing on the next hourly sync."
              action={
                <Button asChild>
                  <Link href="/influencer/campaigns">Browse campaigns</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {live.map((app) => (
                <ActiveCampaignCard key={app.id} application={app} />
              ))}
            </div>
          )}
        </div>
      </section>
    </PageBody>
  );
}
