import { AlertTriangle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkline } from "@/components/charts/sparkline";
import { PayoutStatusPill, PlatformTag, PRICING_LABEL } from "@/components/status";
import { SyncButton } from "./sync-button";
import type {
  InfluencerApplication,
  Platform,
  PricingModel,
} from "@prisma/client";
import { formatCount, formatMoney, relativeTime } from "@/lib/utils";

type ActiveApplication = InfluencerApplication & {
  campaign: {
    id: string;
    title: string;
    pricingModel: PricingModel;
    cpmRate: number;
    cpcRate: number;
    minPayoutThresholdCents: number;
    brand: { name: string | null; companyName: string | null };
  };
  snapshots: { capturedAt: Date; views: number; clicks: number; earningsCents: number }[];
  fraudFlags: { id: string }[];
};

export function ActiveCampaignCard({
  application,
}: {
  application: ActiveApplication;
}) {
  const unpaid = Math.max(
    0,
    application.earningsCents - application.paidOutCents
  );
  const threshold = application.campaign.minPayoutThresholdCents;
  const flagged = application.fraudFlags.length > 0;

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-[0.9375rem] font-medium tracking-[-0.01em] text-ink">
            {application.campaign.title}
          </p>
          <p className="mt-0.5 truncate text-xs text-ink-tertiary">
            {application.campaign.brand.companyName ??
              application.campaign.brand.name}
          </p>
        </div>
        <Badge tone="accent">
          {PRICING_LABEL[application.campaign.pricingModel]}
        </Badge>
      </div>

      {flagged && (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-danger/25 bg-danger-muted px-3 py-2 text-xs leading-relaxed text-danger">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            This content is under review. Payouts are paused until our team
            clears it — your earnings keep accruing in the meantime.
          </span>
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-ink-tertiary">Views</p>
          <p className="tabular mt-0.5 font-display text-base font-medium text-ink">
            {formatCount(application.views)}
          </p>
        </div>
        <div>
          <p className="text-xs text-ink-tertiary">Clicks</p>
          <p className="tabular mt-0.5 font-display text-base font-medium text-ink">
            {formatCount(application.clicks)}
          </p>
        </div>
        <div>
          <p className="text-xs text-ink-tertiary">Earned</p>
          <p className="tabular mt-0.5 font-display text-base font-medium text-accent">
            {formatMoney(application.earningsCents)}
          </p>
        </div>
      </div>

      {application.snapshots.length > 1 && (
        <div className="mt-4">
          <Sparkline
            data={application.snapshots.map((s) => s.views)}
            width={999}
            height={40}
            className="w-full"
            tone={flagged ? "danger" : "accent"}
          />
        </div>
      )}

      <div className="mt-4 space-y-2">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-ink-tertiary">Toward next payout</span>
          <span className="tabular text-ink-secondary">
            {formatMoney(unpaid)} / {formatMoney(threshold)}
          </span>
        </div>
        <Progress
          value={unpaid}
          max={threshold}
          tone={unpaid >= threshold ? "success" : "accent"}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="flex items-center gap-3">
          <PayoutStatusPill status={application.payoutStatus} />
          {application.platform && (
            <PlatformTag platform={application.platform as Platform} />
          )}
        </div>
        <SyncButton applicationId={application.id} />
      </div>

      <div className="mt-3 flex items-center justify-between text-[0.6875rem] text-ink-tertiary">
        {application.lastSyncedAt ? (
          <span>Synced {relativeTime(application.lastSyncedAt)}</span>
        ) : (
          <span>Not synced yet</span>
        )}
        {application.contentUrl && (
          <a
            href={application.contentUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-accent hover:underline"
          >
            View post
            <ExternalLink className="size-3" aria-hidden />
          </a>
        )}
      </div>
    </Card>
  );
}
