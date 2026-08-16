import Link from "next/link";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CampaignStatusPill,
  PLATFORM_LABEL,
  PRICING_LABEL,
} from "@/components/status";
import type { Campaign } from "@/lib/db";
import { formatCount, formatDate, formatMoney } from "@/lib/utils";

type CampaignWithCount = Campaign & {
  _count: { applications: number };
  applications: { views: number; clicks: number }[];
};

export function CampaignCard({
  campaign,
  pendingCount = 0,
}: {
  campaign: CampaignWithCount;
  pendingCount?: number;
}) {
  const views = campaign.applications.reduce((sum, a) => sum + a.views, 0);
  const spendRatio =
    campaign.budgetCents > 0 ? campaign.spentCents / campaign.budgetCents : 0;

  const rateLabel =
    campaign.pricingModel === "CPM"
      ? `${formatMoney(campaign.cpmRate)} / 1k views`
      : campaign.pricingModel === "CPC"
        ? `${formatMoney(campaign.cpcRate)} / click`
        : `${formatMoney(campaign.cpmRate)} / 1k + ${formatMoney(campaign.cpcRate)} / click`;

  return (
    <Card interactive className="group flex flex-col p-5">
      <Link href={`/brand/campaigns/${campaign.id}`} className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <CampaignStatusPill status={campaign.status} />
          {pendingCount > 0 && (
            <Badge tone="warning">
              <Users className="size-3" aria-hidden />
              {pendingCount} pending
            </Badge>
          )}
        </div>

        <h3 className="mt-3 font-display text-[0.9375rem] font-medium leading-snug tracking-[-0.01em] text-ink transition-colors group-hover:text-accent">
          {campaign.title}
        </h3>

        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-secondary">
          {campaign.description ?? "No description"}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <Badge tone="accent">{PRICING_LABEL[campaign.pricingModel]}</Badge>
          {campaign.platforms.map((platform) => (
            <Badge key={platform}>{PLATFORM_LABEL[platform]}</Badge>
          ))}
        </div>

        <div className="flex-1" />

        <div className="mt-5 space-y-2">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-ink-tertiary">Spend</span>
            <span className="tabular text-ink-secondary">
              <span className="font-medium text-ink">
                {formatMoney(campaign.spentCents, { compact: true })}
              </span>{" "}
              / {formatMoney(campaign.budgetCents, { compact: true })}
            </span>
          </div>
          <Progress value={campaign.spentCents} max={campaign.budgetCents} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4 text-xs">
          <div>
            <p className="text-ink-tertiary">Views</p>
            <p className="tabular mt-0.5 font-medium text-ink">
              {formatCount(views)}
            </p>
          </div>
          <div>
            <p className="text-ink-tertiary">Creators</p>
            <p className="tabular mt-0.5 font-medium text-ink">
              {campaign._count.applications}
            </p>
          </div>
          <div>
            <p className="text-ink-tertiary">Ends</p>
            <p className="mt-0.5 font-medium text-ink">
              {formatDate(campaign.endDate)}
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs text-ink-tertiary">{rateLabel}</p>
      </Link>
    </Card>
  );
}
