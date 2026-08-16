import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Banknote,
  Eye,
  Megaphone,
  ShieldAlert,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { FraudRateChart } from "@/components/admin/fraud-rate-chart";
import {
  prisma,
  ApplicationStatus,
  CampaignStatus,
  PayoutState,
  Role,
} from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Platform analytics" };

export default async function AdminAnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [
    campaigns,
    applications,
    payoutTotals,
    userCounts,
    flags,
    snapshots,
  ] = await Promise.all([
    prisma.campaign.findMany({
      select: { status: true, budgetCents: true, spentCents: true },
    }),
    prisma.influencerApplication.aggregate({
      _sum: { views: true, clicks: true, earningsCents: true },
      _count: true,
    }),
    prisma.payout.groupBy({
      by: ["status"],
      _sum: { amountCents: true },
      _count: true,
    }),
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.fraudFlag.findMany({
      select: { createdAt: true, resolvedAt: true, resolution: true, severity: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.contentMetricSnapshot.findMany({
      orderBy: { capturedAt: "asc" },
      select: {
        capturedAt: true,
        views: true,
        clicks: true,
        earningsCents: true,
        applicationId: true,
      },
    }),
  ]);

  const paid = payoutTotals.find((p) => p.status === PayoutState.PAID);
  const gmv = campaigns.reduce((s, c) => s + c.spentCents, 0);
  const committed = campaigns.reduce((s, c) => s + c.budgetCents, 0);
  const activeCampaigns = campaigns.filter(
    (c) => c.status === CampaignStatus.ACTIVE
  ).length;

  const influencerCount =
    userCounts.find((u) => u.role === Role.INFLUENCER)?._count ?? 0;
  const brandCount = userCounts.find((u) => u.role === Role.BRAND)?._count ?? 0;

  const flagRate =
    applications._count > 0 ? flags.length / applications._count : 0;

  // Platform-wide series: carry each application's latest cumulative value
  // forward and sum per hour.
  const latest = new Map<string, { views: number; clicks: number; earningsCents: number }>();
  const buckets = new Map<number, { views: number; clicks: number; earningsCents: number }>();

  for (const snap of snapshots) {
    latest.set(snap.applicationId, {
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

  // Fraud flags bucketed by day, for the rate-over-time chart.
  const flagsByDay = new Map<string, { raised: number; cleared: number }>();
  for (const flag of flags) {
    const day = flag.createdAt.toISOString().slice(0, 10);
    const entry = flagsByDay.get(day) ?? { raised: 0, cleared: 0 };
    entry.raised += 1;
    if (flag.resolution === "CLEARED") entry.cleared += 1;
    flagsByDay.set(day, entry);
  }
  const fraudSeries = [...flagsByDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, value]) => ({ day, ...value }));

  return (
    <PageBody>
      <PageHeader
        eyebrow="Administration"
        title="Platform analytics"
        description="Volume, money and fraud across every brand and creator on PayLoop."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          label="GMV (creator earnings accrued)"
          value={gmv}
          format="money"
          icon={TrendingUp}
          accent
          hint={`${formatMoney(committed, { compact: true })} committed across all budgets`}
        />
        <Stat
          label="Payout volume settled"
          value={paid?._sum.amountCents ?? 0}
          format="money"
          icon={Banknote}
          hint={`${paid?._count ?? 0} transfers`}
        />
        <Stat
          label="Total views tracked"
          value={applications._sum.views ?? 0}
          icon={Eye}
          hint={`${(applications._sum.clicks ?? 0).toLocaleString()} clicks`}
        />
        <Stat
          label="Active campaigns"
          value={activeCampaigns}
          icon={Megaphone}
          hint={`${campaigns.length} total`}
        />
        <Stat
          label="Creators & brands"
          value={influencerCount + brandCount}
          icon={Users}
          hint={`${influencerCount} creators · ${brandCount} brands`}
        />
        <Stat
          label="Fraud flag rate"
          value={Math.round(flagRate * 10000)}
          icon={ShieldAlert}
          hint={`${flags.length} flags across ${applications._count} applications`}
        />
      </div>

      <p className="mt-2 text-xs text-ink-tertiary">
        Fraud flag rate is shown in basis points ({(flagRate * 100).toFixed(1)}%
        of applications have been flagged at least once).
      </p>

      {series.length > 1 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Platform volume over time</CardTitle>
            <p className="text-sm text-ink-secondary">
              Cumulative views and creator earnings across every campaign.
            </p>
          </CardHeader>
          <CardContent>
            <PerformanceChart data={series} height={300} />
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Fraud flags over time</CardTitle>
          <p className="text-sm text-ink-secondary">
            Flags raised per day and how many were cleared on review — a rising
            raised-to-cleared gap means the rules are getting stricter than
            reality.
          </p>
        </CardHeader>
        <CardContent>
          <FraudRateChart data={fraudSeries} />
        </CardContent>
      </Card>
    </PageBody>
  );
}
