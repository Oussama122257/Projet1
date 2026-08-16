import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Eye, MousePointerClick, Users, Wallet } from "lucide-react";
import { PageBody } from "@/components/layout/app-shell";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Stat } from "@/components/ui/stat";
import {
  CampaignStatusPill,
  PLATFORM_LABEL,
  PRICING_LABEL,
} from "@/components/status";
import { ApplicantPipeline } from "@/components/brand/applicant-pipeline";
import { PerformanceTable } from "@/components/brand/performance-table";
import { prisma, ApplicationStatus, Role } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Campaign" };

export default async function CampaignDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id },
    include: {
      applications: {
        include: {
          influencer: {
            select: {
              id: true,
              name: true,
              handle: true,
              image: true,
              country: true,
              verification: true,
              socialLinks: {
                select: { platform: true, username: true, followerCount: true },
              },
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
          fraudFlags: {
            where: { resolvedAt: null },
            select: { id: true, reason: true, severity: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!campaign) notFound();
  if (campaign.brandId !== user.id && user.role !== Role.ADMIN) {
    redirect("/brand/campaigns");
  }

  const approved = campaign.applications.filter(
    (a) => a.status === ApplicationStatus.APPROVED
  );
  const totals = approved.reduce(
    (acc, app) => ({
      views: acc.views + app.views,
      clicks: acc.clicks + app.clicks,
    }),
    { views: 0, clicks: 0 }
  );

  // Combined series: each application's cumulative value carried forward and
  // summed per hour, so the campaign line only ever moves up.
  const latest = new Map<string, number>();
  const latestEarnings = new Map<string, number>();
  const latestClicks = new Map<string, number>();
  const buckets = new Map<number, { views: number; clicks: number; earningsCents: number }>();

  const allSnapshots = approved
    .flatMap((app) => app.snapshots.map((s) => ({ ...s, appId: app.id })))
    .sort((a, b) => a.capturedAt.getTime() - b.capturedAt.getTime());

  for (const snap of allSnapshots) {
    latest.set(snap.appId, snap.views);
    latestClicks.set(snap.appId, snap.clicks);
    latestEarnings.set(snap.appId, snap.earningsCents);
    const hour = Math.floor(snap.capturedAt.getTime() / 3_600_000) * 3_600_000;
    buckets.set(hour, {
      views: [...latest.values()].reduce((a, b) => a + b, 0),
      clicks: [...latestClicks.values()].reduce((a, b) => a + b, 0),
      earningsCents: [...latestEarnings.values()].reduce((a, b) => a + b, 0),
    });
  }

  const series = [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([ts, v]) => ({ capturedAt: new Date(ts), ...v }));

  const rateLabel =
    campaign.pricingModel === "CPM"
      ? `${formatMoney(campaign.cpmRate)} per 1,000 views`
      : campaign.pricingModel === "CPC"
        ? `${formatMoney(campaign.cpcRate)} per click`
        : `${formatMoney(campaign.cpmRate)} per 1,000 views + ${formatMoney(campaign.cpcRate)} per click`;

  return (
    <PageBody>
      <Button asChild variant="ghost" size="sm" className="-ml-3 mb-4">
        <Link href="/brand/campaigns">
          <ArrowLeft className="size-4" />
          Campaigns
        </Link>
      </Button>

      <div className="flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <CampaignStatusPill status={campaign.status} />
            <Badge tone="accent">{PRICING_LABEL[campaign.pricingModel]}</Badge>
            {campaign.platforms.map((platform) => (
              <Badge key={platform}>{PLATFORM_LABEL[platform]}</Badge>
            ))}
          </div>

          <h1 className="mt-3 font-display text-display-sm text-ink">
            {campaign.title}
          </h1>

          {campaign.description && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-secondary">
              {campaign.description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-tertiary">
            <span>{rateLabel}</span>
            <span>
              {formatDate(campaign.startDate)} — {formatDate(campaign.endDate)}
            </span>
            <span>
              Payout threshold {formatMoney(campaign.minPayoutThresholdCents)}
            </span>
          </div>

          {campaign.hashtags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {campaign.hashtags.map((tag) => (
                <span key={tag} className="text-xs text-accent">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="w-full shrink-0 rounded-lg border border-border bg-surface-raised p-5 lg:w-72">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-ink-tertiary">Budget used</span>
            <span className="tabular text-sm font-medium text-ink">
              {campaign.budgetCents > 0
                ? `${((campaign.spentCents / campaign.budgetCents) * 100).toFixed(1)}%`
                : "—"}
            </span>
          </div>
          <p className="tabular mt-2 font-display text-2xl font-semibold text-ink">
            {formatMoney(campaign.spentCents)}
          </p>
          <p className="text-xs text-ink-tertiary">
            of {formatMoney(campaign.budgetCents)} committed
          </p>
          <Progress
            className="mt-4"
            value={campaign.spentCents}
            max={campaign.budgetCents}
          />
          <p className="mt-3 text-xs text-ink-tertiary">
            Earnings are capped at the remaining budget, so this can never exceed
            100%.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Views"
          value={totals.views}
          icon={Eye}
          trend={series.slice(-16).map((s) => s.views)}
        />
        <Stat
          label="Clicks"
          value={totals.clicks}
          icon={MousePointerClick}
          trend={series.slice(-16).map((s) => s.clicks)}
        />
        <Stat
          label="Creators live"
          value={approved.length}
          icon={Users}
          hint={`${campaign.applications.length} total applications`}
        />
        <Stat
          label="Accrued to creators"
          value={campaign.spentCents}
          format="money"
          icon={Wallet}
          accent
        />
      </div>

      {series.length > 1 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Views and earnings over time</CardTitle>
            <p className="text-sm text-ink-secondary">
              Every point is a metric snapshot pulled from the platform API.
            </p>
          </CardHeader>
          <CardContent>
            <PerformanceChart data={series} height={280} />
          </CardContent>
        </Card>
      )}

      <section className="mt-10">
        <h2 className="font-display text-lg font-medium tracking-[-0.01em] text-ink">
          Applicant pipeline
        </h2>
        <p className="mt-1 text-sm text-ink-secondary">
          Move creators from pending to live. Approving one lets them submit
          content and start accruing.
        </p>
        <div className="mt-4">
          <ApplicantPipeline
            campaignId={campaign.id}
            applications={campaign.applications}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-medium tracking-[-0.01em] text-ink">
          Creator performance
        </h2>
        <p className="mt-1 text-sm text-ink-secondary">
          Live figures per creator, with the view trend since their content went
          up.
        </p>
        <div className="mt-4">
          <PerformanceTable applications={approved} />
        </div>
      </section>
    </PageBody>
  );
}
