import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Compass } from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { MarketplaceCard } from "@/components/influencer/marketplace-card";
import { SubmitContentPanel } from "@/components/influencer/submit-content-panel";
import { prisma, ApplicationStatus, CampaignStatus } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Find campaigns" };

export default async function MarketplacePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [campaigns, myApplications] = await Promise.all([
    prisma.campaign.findMany({
      where: { status: CampaignStatus.ACTIVE, endDate: { gte: new Date() } },
      include: {
        brand: { select: { name: true, companyName: true, image: true } },
        _count: { select: { applications: true } },
        applications: {
          where: { influencerId: user.id },
          select: { id: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.influencerApplication.findMany({
      where: {
        influencerId: user.id,
        status: ApplicationStatus.APPROVED,
        contentId: null,
      },
      include: {
        campaign: { select: { id: true, title: true, platforms: true } },
      },
    }),
  ]);

  return (
    <PageBody>
      <PageHeader
        title="Find campaigns"
        description="Open campaigns you can apply to. Rates are fixed up front — what you earn depends only on how the content performs."
      />

      {myApplications.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-medium tracking-[-0.01em] text-ink">
            Waiting on your content
          </h2>
          <p className="mt-1 text-sm text-ink-secondary">
            You&apos;re approved on these. Link the post you published and
            tracking starts on the next sync.
          </p>
          <div className="mt-4 space-y-3">
            {myApplications.map((application) => (
              <SubmitContentPanel
                key={application.id}
                applicationId={application.id}
                campaignTitle={application.campaign.title}
                platforms={application.campaign.platforms}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-display text-lg font-medium tracking-[-0.01em] text-ink">
          Open campaigns
          <span className="tabular ml-2 text-sm font-normal text-ink-tertiary">
            {campaigns.length}
          </span>
        </h2>

        <div className="mt-4">
          {campaigns.length === 0 ? (
            <EmptyState
              icon={Compass}
              title="No open campaigns right now"
              description="Brands post new campaigns regularly. Check back soon, or make sure your accounts are connected so you're ready to apply."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {campaigns.map(({ applications, ...campaign }) => (
                <MarketplaceCard
                  key={campaign.id}
                  campaign={campaign}
                  myApplication={applications[0] ?? null}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </PageBody>
  );
}
