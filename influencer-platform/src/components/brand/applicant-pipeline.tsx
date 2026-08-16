"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, ExternalLink, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PayoutStatusPill, PlatformTag } from "@/components/status";
import type {
  ApplicationStatus,
  FraudSeverity,
  InfluencerApplication,
  Platform,
  PayoutStatus,
  VerificationStatus,
} from "@prisma/client";
import { cn, formatCount, formatMoney, relativeTime } from "@/lib/utils";
import { Users } from "lucide-react";

type Applicant = InfluencerApplication & {
  influencer: {
    id: string;
    name: string | null;
    handle: string | null;
    image: string | null;
    country: string | null;
    verification: VerificationStatus;
    socialLinks: { platform: Platform; username: string; followerCount: number }[];
  };
  fraudFlags: { id: string; reason: string; severity: FraudSeverity }[];
};

/**
 * Kanban view of the applicant funnel.
 *
 * Columns are derived from application state rather than stored, so there is no
 * way for a card's position to disagree with the record behind it: "Active" is
 * simply approved-with-content, "Completed" is approved-and-paid.
 */
const COLUMNS: {
  key: string;
  label: string;
  hint: string;
  match: (a: Applicant) => boolean;
}[] = [
  {
    key: "pending",
    label: "Pending",
    hint: "Awaiting your decision",
    match: (a) => a.status === "PENDING",
  },
  {
    key: "approved",
    label: "Approved",
    hint: "Yet to post content",
    match: (a) => a.status === "APPROVED" && !a.contentId,
  },
  {
    key: "active",
    label: "Active",
    hint: "Posted and accruing",
    match: (a) =>
      a.status === "APPROVED" &&
      Boolean(a.contentId) &&
      a.payoutStatus !== "PAID",
  },
  {
    key: "completed",
    label: "Completed",
    hint: "Paid out",
    match: (a) => a.status === "APPROVED" && a.payoutStatus === "PAID",
  },
];

export function ApplicantPipeline({
  campaignId,
  applications,
}: {
  campaignId: string;
  applications: Applicant[];
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function decide(id: string, action: "approve" | "reject") {
    setBusy(id);
    setError(null);

    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? "Could not update this application");
      setBusy(null);
      return;
    }

    router.refresh();
    setBusy(null);
  }

  const rejected = applications.filter((a) => a.status === "REJECTED");

  if (applications.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No applicants yet"
        description="Once creators apply to this campaign they'll show up here, ready for you to approve or pass on."
        compact
      />
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div className="grid gap-3 lg:grid-cols-4">
        {COLUMNS.map((column) => {
          const items = applications.filter(column.match);
          return (
            <div
              key={column.key}
              className="flex flex-col rounded-lg border border-border bg-surface-raised/60"
            >
              <div className="flex items-baseline justify-between border-b border-border px-4 py-3">
                <div>
                  <h3 className="text-[0.8125rem] font-medium text-ink">
                    {column.label}
                  </h3>
                  <p className="mt-0.5 text-xs text-ink-tertiary">{column.hint}</p>
                </div>
                <span className="tabular text-xs text-ink-tertiary">
                  {items.length}
                </span>
              </div>

              <div className="flex-1 space-y-2 p-2">
                <AnimatePresence initial={false}>
                  {items.map((app) => (
                    <motion.div
                      key={app.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className={cn(
                        "rounded-md border bg-surface-overlay p-3",
                        app.fraudFlags.length > 0
                          ? "border-danger/30"
                          : "border-border"
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <Avatar
                          name={app.influencer.name ?? "Creator"}
                          src={app.influencer.image}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.8125rem] font-medium text-ink">
                            {app.influencer.name}
                          </p>
                          <p className="truncate text-xs text-ink-tertiary">
                            @{app.influencer.handle ?? "unknown"}
                            {app.influencer.country && ` · ${app.influencer.country}`}
                          </p>
                        </div>
                      </div>

                      {app.influencer.socialLinks.length > 0 && (
                        <p className="tabular mt-2 text-xs text-ink-secondary">
                          {formatCount(
                            Math.max(
                              ...app.influencer.socialLinks.map((s) => s.followerCount)
                            )
                          )}{" "}
                          followers
                        </p>
                      )}

                      {app.fraudFlags.length > 0 && (
                        <Badge tone="danger" className="mt-2">
                          <AlertTriangle className="size-3" aria-hidden />
                          {app.fraudFlags.length} flag
                          {app.fraudFlags.length === 1 ? "" : "s"}
                        </Badge>
                      )}

                      {column.key === "pending" && app.pitch && (
                        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-ink-secondary">
                          {app.pitch}
                        </p>
                      )}

                      {column.key !== "pending" && app.contentId && (
                        <div className="mt-2.5 space-y-1.5 border-t border-border pt-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-ink-tertiary">Views</span>
                            <span className="tabular text-ink">
                              {formatCount(app.views)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-ink-tertiary">Earned</span>
                            <span className="tabular font-medium text-accent">
                              {formatMoney(app.earningsCents)}
                            </span>
                          </div>
                          <PayoutStatusPill status={app.payoutStatus as PayoutStatus} />
                        </div>
                      )}

                      {column.key === "pending" ? (
                        <div className="mt-3 flex gap-1.5">
                          <Button
                            size="sm"
                            className="flex-1"
                            loading={busy === app.id}
                            onClick={() => decide(app.id, "approve")}
                          >
                            <Check className="size-3.5" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busy === app.id}
                            onClick={() => decide(app.id, "reject")}
                            aria-label={`Reject ${app.influencer.name}`}
                          >
                            <X className="size-3.5" />
                          </Button>
                        </div>
                      ) : (
                        app.contentUrl && (
                          <a
                            href={app.contentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2.5 inline-flex items-center gap-1 text-xs text-accent hover:underline"
                          >
                            View post
                            <ExternalLink className="size-3" aria-hidden />
                          </a>
                        )
                      )}

                      <p className="mt-2 text-[0.6875rem] text-ink-tertiary">
                        Applied {relativeTime(app.createdAt)}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {items.length === 0 && (
                  <p className="px-2 py-6 text-center text-xs text-ink-tertiary">
                    Nothing here yet
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {rejected.length > 0 && (
        <details className="rounded-lg border border-border bg-surface-raised/60 px-4 py-3">
          <summary className="cursor-pointer text-[0.8125rem] text-ink-secondary">
            {rejected.length} rejected application
            {rejected.length === 1 ? "" : "s"}
          </summary>
          <ul className="mt-3 space-y-2">
            {rejected.map((app) => (
              <li key={app.id} className="flex items-center gap-2.5 text-sm">
                <Avatar
                  name={app.influencer.name ?? "Creator"}
                  src={app.influencer.image}
                  size="xs"
                />
                <span className="text-ink-secondary">{app.influencer.name}</span>
                {app.rejectReason && (
                  <span className="truncate text-xs text-ink-tertiary">
                    — {app.rejectReason}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
