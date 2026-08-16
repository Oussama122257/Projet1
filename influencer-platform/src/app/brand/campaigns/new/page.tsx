import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageBody } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { CampaignWizard } from "@/components/brand/campaign-wizard";

export const metadata: Metadata = { title: "New campaign" };

export default function NewCampaignPage() {
  return (
    <PageBody>
      <Button asChild variant="ghost" size="sm" className="-ml-3 mb-4">
        <Link href="/brand/campaigns">
          <ArrowLeft className="size-4" />
          Campaigns
        </Link>
      </Button>

      <div className="mx-auto max-w-2xl">
        <div className="border-b border-border pb-6">
          <h1 className="font-display text-display-sm text-ink">
            Create a campaign
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
            Set your pricing model and budget. Creators apply, you approve, and
            payouts run automatically once content is live.
          </p>
        </div>

        <div className="mt-8">
          <CampaignWizard />
        </div>
      </div>
    </PageBody>
  );
}
