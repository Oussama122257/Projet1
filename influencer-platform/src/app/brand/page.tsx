import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, MousePointerClick, Plus, TrendingUp, Wallet } from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/app-shell";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Stat } from "@/components/ui/stat";
import { CampaignCard } from "@/components/brand/campaign-card";
import { prisma, ApplicationStatus, CampaignStatus } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Brand overview" };

export default async function BrandOverviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const campaigns = await prisma.campaign.findMany({
    where: { brandId: user.id },
    include: {
      _count: { select: { applications: true } },
      applications: {
        select: {
          status: true,
          views: true,
          clicks: true,
          earningsCents: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const approvedApplications = await prisma.influencerApplication.findMany({
    where: {
      campaign: { brandId: user.id },
      status: ApplicationStatus.APPROVED,
    },
    select: { id: true },
  });

  // One combined series across every campaign, bucketed by hour so the chart
  // reads as "the brand's performance" rather than a tangle of per-post lines.
  const snapshots = await prisma.contentMetricSnapshot.findMany({
    where: { applicationId: { in: approvedApplications.map((a) => a.id) } },
    orderBy: { capturedAt: "asc" },
    select: {
      capturedAt: true,
      views: true,
      clicks: true,
      earningsCents: true,
      applicationId: true,
    },
  });

  const buckets = new Map<
    number,
    { views: number; clicks: number; earningsCents: number }
  >();
  // Snapshot values are cumulative per application, so the portfolio total at
  // time T is the sum of each application's latest value at or before T.
  const latestPerApp = new Map<string, { views: number; clicks: number; earningsCents: number }>();

  for (const snap of snapshots) {
    latestPerApp.set(snap.applicationId, {
      views: snap.views,
      clicks: snap.clicks,
      earningsCents: snap.earningsCents,
    });
    const hour = Math.floor(snap.capturedAt.getTime() / 3_600_000) * 3_600_000;
    let totals = { views: 0, clicks: 0, earningsCents: 0 };
    for (const value of latestPerApp.values()) {
      totals = {
        views: totals.views + value.views,
        clicks: totals.clicks + value.clicks,
        earningsCents: totals.earningsCents + value.earningsCents,
      };
    }
    buckets.set(hour, totals);
  }

  const series = [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([ts, totals]) => ({ capturedAt: new Date(ts), ...totals }));

  const totals = campaigns.reduce(
    (acc, campaign) => {
      for (const app of campaign.applications) {
        if (app.status !== ApplicationStatus.APPROVED) continue;
        acc.views += app.views;
        acc.clicks += app.clicks;
      }
      acc.spent += campaign.spentCents;
      acc.budget += campaign.budgetCents;
      return acc;
    },
    { views: 0, clicks: 0, spent: 0, budget: 0 }
  );

  const active = campaigns.filter((c) => c.status === CampaignStatus.ACTIVE);
  const cpmEffective =
    totals.views > 0 ? Math.round((totals.spent / totals.views) * 1000) : 0;

  return (
    <PageBody>
      <PageHeader
        title={`Welcome back, ${user.name?.split(" ")[0] ?? "there"}`}
        description="Performance across every campaign you're running, refreshed hourly from the platforms themselves."
        actions={
          <Button asChild>
            <Link href="/brand/campaigns/new">
              <Plus className="size-4" />
              New campaign
            </Link>
          </Button>
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Total views"
          value={totals.views}
          icon={Eye}
          hint={`${active.length} active campaign${active.length === 1 ? "" : "s"}`}
          trend={series.slice(-16).map((s) => s.views)}
        />
        <Stat
          label="Total clicks"
          value={totals.clicks}
          icon={MousePointerClick}
          hint={
            totals.views > 0
              ? `${((totals.clicks / totals.views) * 100).toFixed(2)}% click-through`
              : "No traffic yet"
          }
          trend={series.slice(-16).map((s) => s.clicks)}
        />
        <Stat
          label="Spend to date"
          value={totals.spent}
          format="money"
          icon={Wallet}
          hint={`of ${(totals.budget / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} committed`}
        />
        <Stat
          label="Effective CPM"
          value={cpmEffective}
          format="money"
          icon={TrendingUp}
          accent
          hint="Actual cost per 1,000 views"
        />
      </div>

      {series.length > 1 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Portfolio performance</CardTitle>
            <p className="text-sm text-ink-secondary">
              Cumulative views and accrued creator earnings across all campaigns.
            </p>
          </CardHeader>
          <CardContent>
            <PerformanceChart data={series} height={280} />
          </CardContent>
        </Card>
      )}

      <div className="mt-10">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-lg font-medium tracking-[-0.01em] text-ink">
            Your campaigns
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/brand/campaigns">View all</Link>
          </Button>
        </div>

        <div className="mt-4">
          {campaigns.length === 0 ? (
            <EmptyState
              icon={Plus}
              title="No campaigns yet"
              description="Create your first campaign to start recruiting creators and paying for verified performance."
              action={
                <Button asChild>
                  <Link href="/brand/campaigns/new">
                    <Plus className="size-4" />
                    Create a campaign
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {campaigns.slice(0, 6).map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  pendingCount={
                    campaign.applications.filter(
                      (a) => a.status === ApplicationStatus.PENDING
                    ).length
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageBody>
  );
}
