"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { PLATFORM_LABEL, PRICING_LABEL } from "@/components/status";
import type { ApplicationStatus, Campaign } from "@prisma/client";
import { formatDate, formatMoney } from "@/lib/utils";

type MarketplaceCampaign = Campaign & {
  brand: { name: string | null; companyName: string | null; image: string | null };
  _count: { applications: number };
};

export function MarketplaceCard({
  campaign,
  myApplication,
}: {
  campaign: MarketplaceCampaign;
  myApplication: { id: string; status: ApplicationStatus } | null;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = React.useState(false);
  const [pitch, setPitch] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function apply() {
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignId: campaign.id,
        pitch: pitch || undefined,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? "Could not submit your application");
      setSubmitting(false);
      return;
    }

    setExpanded(false);
    router.refresh();
    setSubmitting(false);
  }

  const rate =
    campaign.pricingModel === "CPM"
      ? `${formatMoney(campaign.cpmRate)} per 1,000 views`
      : campaign.pricingModel === "CPC"
        ? `${formatMoney(campaign.cpcRate)} per click`
        : `${formatMoney(campaign.cpmRate)} / 1k + ${formatMoney(campaign.cpcRate)} / click`;

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs text-ink-tertiary">
            {campaign.brand.companyName ?? campaign.brand.name}
          </p>
          <h3 className="mt-1 font-display text-[0.9375rem] font-medium leading-snug tracking-[-0.01em] text-ink">
            {campaign.title}
          </h3>
        </div>
        <Badge tone="accent">{PRICING_LABEL[campaign.pricingModel]}</Badge>
      </div>

      {campaign.description && (
        <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-ink-secondary">
          {campaign.description}
        </p>
      )}

      <div className="mt-4 rounded-md border border-accent/20 bg-accent-muted/40 px-3 py-2.5">
        <p className="text-xs text-ink-tertiary">You earn</p>
        <p className="tabular mt-0.5 text-sm font-medium text-accent">{rate}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {campaign.platforms.map((platform) => (
          <Badge key={platform}>{PLATFORM_LABEL[platform]}</Badge>
        ))}
      </div>

      <div className="flex-1" />

      <div className="mt-4 flex items-center gap-4 border-t border-border pt-4 text-xs text-ink-tertiary">
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-3.5" aria-hidden />
          {campaign._count.applications} applied
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5" aria-hidden />
          Ends {formatDate(campaign.endDate)}
        </span>
      </div>

      <div className="mt-4">
        {myApplication ? (
          <Badge
            tone={
              myApplication.status === "APPROVED"
                ? "success"
                : myApplication.status === "REJECTED"
                  ? "danger"
                  : "warning"
            }
            dot
          >
            {myApplication.status === "APPROVED"
              ? "You're approved"
              : myApplication.status === "REJECTED"
                ? "Not selected"
                : "Application pending"}
          </Badge>
        ) : expanded ? (
          <div className="space-y-2.5">
            <Textarea
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              placeholder="Why you're a fit — audience, past results, the angle you'd take."
              className="min-h-[72px] text-[0.8125rem]"
              autoFocus
            />
            {error && <p className="text-xs text-danger">{error}</p>}
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                loading={submitting}
                onClick={apply}
              >
                <Check className="size-3.5" />
                Submit application
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setExpanded(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" className="w-full" onClick={() => setExpanded(true)}>
            Apply
          </Button>
        )}
      </div>
    </Card>
  );
}
