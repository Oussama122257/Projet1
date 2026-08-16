import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Megaphone, Plus } from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CampaignCard } from "@/components/brand/campaign-card";
import { prisma, ApplicationStatus, CampaignStatus } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Campaigns" };

const FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "DRAFT", label: "Draft" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" },
];

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const status = searchParams.status ?? "all";

  const campaigns = await prisma.campaign.findMany({
    where: {
      brandId: user.id,
      ...(status !== "all" ? { status: status as CampaignStatus } : {}),
    },
    include: {
      _count: { select: { applications: true } },
      applications: { select: { status: true, views: true, clicks: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageBody>
      <PageHeader
        title="Campaigns"
        description="Every campaign you've created, with spend tracked against budget in real time."
        actions={
          <Button asChild>
            <Link href="/brand/campaigns/new">
              <Plus className="size-4" />
              New campaign
            </Link>
          </Button>
        }
      />

      <div className="mt-6 flex flex-wrap gap-1.5">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={
              filter.value === "all"
                ? "/brand/campaigns"
                : `/brand/campaigns?status=${filter.value}`
            }
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-[0.8125rem] transition-colors",
              status === filter.value
                ? "border-accent/40 bg-accent-muted text-accent"
                : "border-border bg-surface-raised text-ink-secondary hover:border-ink-tertiary/40 hover:text-ink"
            )}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        {campaigns.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title={
              status === "all"
                ? "No campaigns yet"
                : `No ${status.toLowerCase()} campaigns`
            }
            description={
              status === "all"
                ? "Create a campaign to set your pricing model, budget and platform targets, then start approving creators."
                : "Try a different filter, or create a new campaign."
            }
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
            {campaigns.map((campaign) => (
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
    </PageBody>
  );
}
