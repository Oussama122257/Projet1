import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ApplicationStatusPill, VerificationPill } from "@/components/status";
import { prisma, ApplicationStatus } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatCount, relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Applicants" };

export default async function ApplicantsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const applications = await prisma.influencerApplication.findMany({
    where: { campaign: { brandId: user.id } },
    include: {
      campaign: { select: { id: true, title: true } },
      influencer: {
        select: {
          id: true,
          name: true,
          handle: true,
          image: true,
          country: true,
          verification: true,
          socialLinks: { select: { platform: true, followerCount: true } },
        },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const pending = applications.filter(
    (a) => a.status === ApplicationStatus.PENDING
  );
  const reviewed = applications.filter(
    (a) => a.status !== ApplicationStatus.PENDING
  );

  return (
    <PageBody>
      <PageHeader
        title="Applicants"
        description="Everyone who has applied across your campaigns. Approve from a campaign's pipeline to keep the decision in context."
      />

      {applications.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Users}
            title="No applicants yet"
            description="Publish a campaign and creators will start applying. You'll review them here and in each campaign's pipeline."
            action={
              <Button asChild>
                <Link href="/brand/campaigns/new">Create a campaign</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {[
            { title: "Awaiting your decision", rows: pending },
            { title: "Reviewed", rows: reviewed },
          ]
            .filter((section) => section.rows.length > 0)
            .map((section) => (
              <section key={section.title}>
                <h2 className="font-display text-base font-medium text-ink">
                  {section.title}
                  <span className="tabular ml-2 text-sm font-normal text-ink-tertiary">
                    {section.rows.length}
                  </span>
                </h2>

                <div className="mt-3 overflow-hidden rounded-lg border border-border bg-surface-raised">
                  {section.rows.map((app) => (
                    <Link
                      key={app.id}
                      href={`/brand/campaigns/${app.campaign.id}`}
                      className="flex flex-wrap items-center gap-4 border-b border-border/60 px-4 py-3.5 transition-colors last:border-0 hover:bg-surface-overlay/50"
                    >
                      <Avatar
                        name={app.influencer.name ?? "Creator"}
                        src={app.influencer.image}
                        size="md"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-ink">
                            {app.influencer.name}
                          </span>
                          <VerificationPill status={app.influencer.verification} />
                        </div>
                        <p className="mt-0.5 truncate text-xs text-ink-tertiary">
                          @{app.influencer.handle}
                          {app.influencer.country && ` · ${app.influencer.country}`}
                          {" · applied "}
                          {relativeTime(app.createdAt)}
                        </p>
                      </div>

                      <div className="hidden min-w-0 flex-1 sm:block">
                        <p className="truncate text-sm text-ink-secondary">
                          {app.campaign.title}
                        </p>
                      </div>

                      <div className="tabular hidden text-sm text-ink-secondary md:block">
                        {app.influencer.socialLinks.length > 0
                          ? `${formatCount(
                              Math.max(
                                ...app.influencer.socialLinks.map(
                                  (s) => s.followerCount
                                )
                              )
                            )} followers`
                          : "—"}
                      </div>

                      <ApplicationStatusPill status={app.status} />
                    </Link>
                  ))}
                </div>
              </section>
            ))}
        </div>
      )}
    </PageBody>
  );
}
