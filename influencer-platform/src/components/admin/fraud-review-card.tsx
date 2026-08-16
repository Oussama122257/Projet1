"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, ExternalLink, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { Sparkline } from "@/components/charts/sparkline";
import {
  FRAUD_REASON_LABEL,
  SeverityPill,
  VerificationPill,
} from "@/components/status";
import type {
  FraudReason,
  FraudSeverity,
  VerificationStatus,
} from "@prisma/client";
import { formatCount, formatDateTime, formatMoney, formatPercent } from "@/lib/utils";

type Flag = {
  id: string;
  reason: FraudReason;
  severity: FraudSeverity;
  detail: string;
  evidence: unknown;
  createdAt: Date;
  resolvedAt: Date | null;
  resolution: string | null;
  resolverNote: string | null;
  resolvedBy: { name: string | null; email: string } | null;
  application: {
    id: string;
    views: number;
    clicks: number;
    earningsCents: number;
    contentUrl: string | null;
    influencer: {
      id: string;
      name: string | null;
      handle: string | null;
      image: string | null;
      country: string | null;
      verification: VerificationStatus;
    };
    campaign: { id: string; title: string };
    snapshots: {
      capturedAt: Date;
      views: number;
      clicks: number;
      viewsDelta: number;
    }[];
  };
};

/**
 * A single flag with the evidence that produced it.
 *
 * The evidence JSON is rendered as labelled rows rather than a raw dump — a
 * reviewer deciding whether to release money needs to read the numbers, not
 * parse them.
 */
function EvidenceRows({ evidence }: { evidence: unknown }) {
  if (!evidence || typeof evidence !== "object") return null;

  const entries = Object.entries(evidence as Record<string, unknown>).filter(
    ([, value]) =>
      typeof value === "number" ||
      typeof value === "string" ||
      typeof value === "boolean"
  );

  const distribution = (evidence as Record<string, unknown>).distribution as
    | Record<string, number>
    | undefined;

  const LABELS: Record<string, string> = {
    views: "Views",
    clicks: "Clicks",
    clickRate: "Click rate",
    ctr: "Click-through rate",
    threshold: "Rule threshold",
    thresholdViews: "Views threshold",
    thresholdClicks: "Clicks threshold",
    topRegion: "Dominant region",
    topShare: "Region share",
    sustainedSnapshots: "Consecutive spikes",
    note: "Note",
  };

  const format = (key: string, value: unknown) => {
    if (typeof value === "number") {
      if (["clickRate", "ctr", "topShare", "threshold"].includes(key) && value <= 1) {
        return formatPercent(value, 2);
      }
      return value.toLocaleString();
    }
    return String(value);
  };

  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        {entries.map(([key, value]) => (
          <div key={key}>
            <dt className="text-[0.6875rem] text-ink-tertiary">
              {LABELS[key] ?? key}
            </dt>
            <dd className="tabular mt-0.5 text-sm text-ink">
              {format(key, value)}
            </dd>
          </div>
        ))}
      </dl>

      {distribution && (
        <div>
          <p className="text-[0.6875rem] text-ink-tertiary">
            Audience distribution
          </p>
          <div className="mt-2 space-y-1.5">
            {Object.entries(distribution)
              .sort(([, a], [, b]) => b - a)
              .map(([region, share]) => (
                <div key={region} className="flex items-center gap-2.5">
                  <span className="w-8 text-xs text-ink-secondary">{region}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-hover">
                    <div
                      className={
                        share > 0.7 ? "h-full bg-danger" : "h-full bg-accent"
                      }
                      style={{ width: `${Math.min(100, share * 100)}%` }}
                    />
                  </div>
                  <span className="tabular w-12 text-right text-xs text-ink-secondary">
                    {formatPercent(share, 1)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function FraudReviewCard({ flag }: { flag: Flag }) {
  const router = useRouter();
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState<"CLEARED" | "UPHELD" | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [showNote, setShowNote] = React.useState(false);

  const app = flag.application;
  const resolved = Boolean(flag.resolvedAt);
  // Snapshots arrive newest-first for the evidence view; the sparkline reads
  // left-to-right in time.
  const trend = [...app.snapshots].reverse().map((s) => s.views);

  async function resolve(resolution: "CLEARED" | "UPHELD") {
    setBusy(resolution);
    setError(null);

    const res = await fetch("/api/admin/fraud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flagId: flag.id, resolution, note: note || undefined }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? "Could not resolve this flag");
      setBusy(null);
      return;
    }

    router.refresh();
    setBusy(null);
  }

  return (
    <Card className={resolved ? "p-5" : "border-danger/25 p-5"}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={
              resolved
                ? "flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface-overlay"
                : "flex size-9 shrink-0 items-center justify-center rounded-md border border-danger/25 bg-danger-muted"
            }
          >
            <AlertTriangle
              className={resolved ? "size-4 text-ink-tertiary" : "size-4 text-danger"}
              aria-hidden
            />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-[0.9375rem] font-medium text-ink">
                {FRAUD_REASON_LABEL[flag.reason]}
              </h3>
              <SeverityPill severity={flag.severity} />
              {resolved && (
                <Badge tone={flag.resolution === "CLEARED" ? "success" : "danger"}>
                  {flag.resolution === "CLEARED" ? "Cleared" : "Upheld"}
                </Badge>
              )}
            </div>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-secondary">
              {flag.detail}
            </p>
            <p className="mt-1.5 text-xs text-ink-tertiary">
              Raised {formatDateTime(flag.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Avatar
            name={app.influencer.name ?? "Creator"}
            src={app.influencer.image}
            size="md"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">
              {app.influencer.name}
            </p>
            <p className="truncate text-xs text-ink-tertiary">
              @{app.influencer.handle}
              {app.influencer.country && ` · ${app.influencer.country}`}
            </p>
            <div className="mt-1">
              <VerificationPill status={app.influencer.verification} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 border-t border-border pt-5 lg:grid-cols-[1fr_1fr]">
        <div>
          <p className="eyebrow mb-3">Evidence</p>
          <EvidenceRows evidence={flag.evidence} />
        </div>

        <div>
          <p className="eyebrow mb-3">Application</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
            <div>
              <dt className="text-[0.6875rem] text-ink-tertiary">Campaign</dt>
              <dd className="mt-0.5 truncate text-sm text-ink">
                {app.campaign.title}
              </dd>
            </div>
            <div>
              <dt className="text-[0.6875rem] text-ink-tertiary">Views</dt>
              <dd className="tabular mt-0.5 text-sm text-ink">
                {formatCount(app.views)}
              </dd>
            </div>
            <div>
              <dt className="text-[0.6875rem] text-ink-tertiary">Clicks</dt>
              <dd className="tabular mt-0.5 text-sm text-ink">
                {formatCount(app.clicks)}
              </dd>
            </div>
            <div>
              <dt className="text-[0.6875rem] text-ink-tertiary">At stake</dt>
              <dd className="tabular mt-0.5 text-sm font-medium text-accent">
                {formatMoney(app.earningsCents)}
              </dd>
            </div>
          </dl>

          {trend.length > 1 && (
            <div className="mt-4">
              <p className="text-[0.6875rem] text-ink-tertiary">
                View trend (last {trend.length} snapshots)
              </p>
              <Sparkline
                data={trend}
                width={999}
                height={44}
                className="mt-2 w-full"
                tone="danger"
              />
            </div>
          )}

          {app.contentUrl && (
            <a
              href={app.contentUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs text-accent hover:underline"
            >
              Open the content
              <ExternalLink className="size-3" aria-hidden />
            </a>
          )}
        </div>
      </div>

      {resolved ? (
        (flag.resolverNote || flag.resolvedBy) && (
          <div className="mt-5 rounded-md border border-border bg-surface-overlay/60 px-4 py-3">
            <p className="text-xs text-ink-tertiary">
              Resolved by {flag.resolvedBy?.name ?? flag.resolvedBy?.email ?? "an admin"}
              {flag.resolvedAt && ` · ${formatDateTime(flag.resolvedAt)}`}
            </p>
            {flag.resolverNote && (
              <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">
                {flag.resolverNote}
              </p>
            )}
          </div>
        )
      ) : (
        <div className="mt-5 space-y-3 border-t border-border pt-5">
          {showNote && (
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why you're clearing or upholding this — recorded in the audit trail."
              className="min-h-[64px] text-[0.8125rem]"
              autoFocus
            />
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              loading={busy === "CLEARED"}
              disabled={busy !== null}
              onClick={() => resolve("CLEARED")}
            >
              <Check className="size-3.5" />
              Clear and release payout
            </Button>
            <Button
              size="sm"
              variant="danger"
              loading={busy === "UPHELD"}
              disabled={busy !== null}
              onClick={() => resolve("UPHELD")}
            >
              <X className="size-3.5" />
              Uphold and keep held
            </Button>
            {!showNote && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowNote(true)}
                disabled={busy !== null}
              >
                Add a note
              </Button>
            )}
          </div>

          <p className="text-xs text-ink-tertiary">
            Clearing the last open flag on this application returns it to the
            payout queue on the next hourly run.
          </p>
        </div>
      )}
    </Card>
  );
}
