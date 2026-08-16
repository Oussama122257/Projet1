import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { FraudReviewCard } from "@/components/admin/fraud-review-card";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Fraud queue" };

export default async function FraudQueuePage({
  searchParams,
}: {
  searchParams: { view?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const resolved = searchParams.view === "resolved";

  const flags = await prisma.fraudFlag.findMany({
    where: resolved ? { resolvedAt: { not: null } } : { resolvedAt: null },
    include: {
      application: {
        include: {
          influencer: {
            select: {
              id: true,
              name: true,
              handle: true,
              image: true,
              country: true,
              verification: true,
            },
          },
          campaign: { select: { id: true, title: true, pricingModel: true } },
          snapshots: {
            orderBy: { capturedAt: "desc" },
            take: 12,
            select: {
              capturedAt: true,
              views: true,
              clicks: true,
              viewsDelta: true,
            },
          },
        },
      },
      resolvedBy: { select: { name: true, email: true } },
    },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  const [openCount, resolvedCount] = await Promise.all([
    prisma.fraudFlag.count({ where: { resolvedAt: null } }),
    prisma.fraudFlag.count({ where: { resolvedAt: { not: null } } }),
  ]);

  return (
    <PageBody>
      <PageHeader
        eyebrow="Administration"
        title="Fraud review queue"
        description="Flagged applications are excluded from the payout run until someone here clears them. Each flag shows the metrics that tripped the rule."
      />

      <div className="mt-6 flex gap-1.5">
        {[
          { view: "open", label: "Open", count: openCount },
          { view: "resolved", label: "Resolved", count: resolvedCount },
        ].map((tab) => (
          <Link
            key={tab.view}
            href={tab.view === "open" ? "/admin" : "/admin?view=resolved"}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.8125rem] transition-colors",
              (tab.view === "resolved") === resolved
                ? "border-accent/40 bg-accent-muted text-accent"
                : "border-border bg-surface-raised text-ink-secondary hover:border-ink-tertiary/40 hover:text-ink"
            )}
          >
            {tab.label}
            <span className="tabular text-xs opacity-70">{tab.count}</span>
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {flags.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title={resolved ? "Nothing resolved yet" : "Queue is clear"}
            description={
              resolved
                ? "Flags you clear or uphold will be archived here with the reviewer's note."
                : "No applications are currently flagged. Every approved creator is clear to be paid on the next hourly run."
            }
          />
        ) : (
          flags.map((flag) => <FraudReviewCard key={flag.id} flag={flag} />)
        )}
      </div>
    </PageBody>
  );
}
