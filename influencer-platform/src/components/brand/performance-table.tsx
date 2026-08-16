import { AlertTriangle, ExternalLink } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Sparkline } from "@/components/charts/sparkline";
import { PayoutStatusPill, PlatformTag } from "@/components/status";
import type {
  FraudSeverity,
  InfluencerApplication,
  Platform,
} from "@prisma/client";
import { formatCount, formatMoney, formatPercent, relativeTime } from "@/lib/utils";
import { BarChart3 } from "lucide-react";

type Row = InfluencerApplication & {
  influencer: {
    name: string | null;
    handle: string | null;
    image: string | null;
    country: string | null;
  };
  snapshots: { capturedAt: Date; views: number; clicks: number; earningsCents: number }[];
  fraudFlags: { id: string; severity: FraudSeverity }[];
};

/**
 * Per-creator performance.
 *
 * Numbers are right-aligned and tabular so columns compare down the page, and
 * the view trend is an inline sparkline rather than a separate chart — at this
 * density the shape matters more than the exact curve.
 */
export function PerformanceTable({ applications }: { applications: Row[] }) {
  if (applications.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No live content yet"
        description="Once an approved creator posts and links their content, their performance appears here and starts accruing earnings."
        compact
      />
    );
  }

  const sorted = [...applications].sort((a, b) => b.views - a.views);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface-raised">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-xs font-medium text-ink-tertiary">
                Creator
              </th>
              <th className="px-4 py-3 text-xs font-medium text-ink-tertiary">
                Trend
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-ink-tertiary">
                Views
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-ink-tertiary">
                Clicks
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-ink-tertiary">
                CTR
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-ink-tertiary">
                Earned
              </th>
              <th className="px-4 py-3 text-xs font-medium text-ink-tertiary">
                Payout
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((app) => {
              const trend = app.snapshots.map((s) => s.views);
              const ctr = app.views > 0 ? app.clicks / app.views : 0;
              const flagged = app.fraudFlags.length > 0;

              return (
                <tr
                  key={app.id}
                  className="border-b border-border/60 transition-colors last:border-0 hover:bg-surface-overlay/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        name={app.influencer.name ?? "Creator"}
                        src={app.influencer.image}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-medium text-ink">
                            {app.influencer.name}
                          </span>
                          {flagged && (
                            <AlertTriangle
                              className="size-3.5 shrink-0 text-danger"
                              aria-label="Fraud flag raised"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="truncate text-xs text-ink-tertiary">
                            @{app.influencer.handle}
                          </span>
                          {app.platform && (
                            <PlatformTag platform={app.platform as Platform} />
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <Sparkline
                      data={trend}
                      tone={flagged ? "danger" : "accent"}
                    />
                  </td>

                  <td className="tabular px-4 py-3 text-right text-ink">
                    {formatCount(app.views)}
                  </td>
                  <td className="tabular px-4 py-3 text-right text-ink">
                    {formatCount(app.clicks)}
                  </td>
                  <td className="tabular px-4 py-3 text-right text-ink-secondary">
                    {formatPercent(ctr, 2)}
                  </td>
                  <td className="tabular px-4 py-3 text-right font-medium text-accent">
                    {formatMoney(app.earningsCents)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <PayoutStatusPill status={app.payoutStatus} />
                      {app.lastSyncedAt && (
                        <span className="text-[0.6875rem] text-ink-tertiary">
                          synced {relativeTime(app.lastSyncedAt)}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-ink-tertiary">
        <span>
          {sorted.length} creator{sorted.length === 1 ? "" : "s"} live
        </span>
        <span className="tabular">
          Total accrued{" "}
          <span className="font-medium text-ink">
            {formatMoney(sorted.reduce((sum, a) => sum + a.earningsCents, 0))}
          </span>
        </span>
      </div>
    </div>
  );
}
