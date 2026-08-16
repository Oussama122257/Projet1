import {
  ApplicationStatus,
  CampaignStatus,
  FraudSeverity,
  PayoutState,
  PayoutStatus,
  Platform,
  StripeConnectStatus,
  VerificationStatus,
} from "@prisma/client";
import { Badge, type BadgeProps } from "@/components/ui/badge";

type Tone = NonNullable<BadgeProps["tone"]>;

/**
 * One place where every enum gets its label and colour.
 *
 * Status colour is load-bearing on this product — "held for review" must never
 * look like "paid" — so the mapping lives here rather than being re-invented at
 * each call site.
 */

const CAMPAIGN: Record<CampaignStatus, { label: string; tone: Tone }> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  ACTIVE: { label: "Active", tone: "success" },
  PAUSED: { label: "Paused", tone: "warning" },
  COMPLETED: { label: "Completed", tone: "info" },
  ARCHIVED: { label: "Archived", tone: "neutral" },
};

const APPLICATION: Record<ApplicationStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "Pending", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
  REJECTED: { label: "Rejected", tone: "danger" },
  COMPLETED: { label: "Completed", tone: "info" },
};

const PAYOUT_STATUS: Record<PayoutStatus, { label: string; tone: Tone }> = {
  NOT_ELIGIBLE: { label: "Below threshold", tone: "neutral" },
  PENDING: { label: "Pending payout", tone: "warning" },
  PROCESSING: { label: "Processing", tone: "info" },
  PAID: { label: "Paid", tone: "success" },
  FAILED: { label: "Failed", tone: "danger" },
  HELD_FOR_REVIEW: { label: "Held for review", tone: "danger" },
};

const PAYOUT_STATE: Record<PayoutState, { label: string; tone: Tone }> = {
  PENDING: { label: "Pending", tone: "warning" },
  PAID: { label: "Paid", tone: "success" },
  FAILED: { label: "Failed", tone: "danger" },
  HELD_FOR_REVIEW: { label: "Held", tone: "danger" },
};

const SEVERITY: Record<FraudSeverity, { label: string; tone: Tone }> = {
  LOW: { label: "Low", tone: "neutral" },
  MEDIUM: { label: "Medium", tone: "warning" },
  HIGH: { label: "High", tone: "danger" },
  CRITICAL: { label: "Critical", tone: "danger" },
};

const VERIFICATION: Record<VerificationStatus, { label: string; tone: Tone }> = {
  UNVERIFIED: { label: "Unverified", tone: "neutral" },
  PENDING: { label: "Pending review", tone: "warning" },
  VERIFIED: { label: "Verified", tone: "success" },
  SUSPENDED: { label: "Suspended", tone: "danger" },
};

const CONNECT: Record<StripeConnectStatus, { label: string; tone: Tone }> = {
  NONE: { label: "Not set up", tone: "neutral" },
  ONBOARDING: { label: "Onboarding", tone: "warning" },
  VERIFIED: { label: "Payouts enabled", tone: "success" },
  RESTRICTED: { label: "Restricted", tone: "danger" },
};

export function CampaignStatusPill({ status }: { status: CampaignStatus }) {
  const { label, tone } = CAMPAIGN[status];
  return <Badge tone={tone} dot>{label}</Badge>;
}

export function ApplicationStatusPill({ status }: { status: ApplicationStatus }) {
  const { label, tone } = APPLICATION[status];
  return <Badge tone={tone} dot>{label}</Badge>;
}

export function PayoutStatusPill({ status }: { status: PayoutStatus }) {
  const { label, tone } = PAYOUT_STATUS[status];
  return <Badge tone={tone} dot>{label}</Badge>;
}

export function PayoutStatePill({ status }: { status: PayoutState }) {
  const { label, tone } = PAYOUT_STATE[status];
  return <Badge tone={tone} dot>{label}</Badge>;
}

export function SeverityPill({ severity }: { severity: FraudSeverity }) {
  const { label, tone } = SEVERITY[severity];
  return <Badge tone={tone}>{label}</Badge>;
}

export function VerificationPill({ status }: { status: VerificationStatus }) {
  const { label, tone } = VERIFICATION[status];
  return <Badge tone={tone} dot>{label}</Badge>;
}

export function ConnectStatusPill({ status }: { status: StripeConnectStatus }) {
  const { label, tone } = CONNECT[status];
  return <Badge tone={tone} dot>{label}</Badge>;
}

export const PLATFORM_LABEL: Record<Platform, string> = {
  TIKTOK: "TikTok",
  INSTAGRAM: "Instagram",
  YOUTUBE: "YouTube",
};

export const PLATFORM_COLOR: Record<Platform, string> = {
  TIKTOK: "#25F4EE",
  INSTAGRAM: "#E1306C",
  YOUTUBE: "#FF0033",
};

export function PlatformTag({ platform }: { platform: Platform }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-secondary">
      <span
        className="size-1.5 rounded-full"
        style={{ background: PLATFORM_COLOR[platform] }}
        aria-hidden
      />
      {PLATFORM_LABEL[platform]}
    </span>
  );
}

export const PRICING_LABEL = {
  CPM: "CPM",
  CPC: "CPC",
  HYBRID: "Hybrid",
} as const;

export const FRAUD_REASON_LABEL = {
  LOW_ENGAGEMENT_RATIO: "Low engagement ratio",
  GEO_CONCENTRATION: "Geographic concentration",
  SPIKE_ANOMALY: "Growth spike anomaly",
  CLICK_VIEW_ANOMALY: "Click-to-view anomaly",
  DUPLICATE_CONTENT: "Duplicate content",
} as const;
