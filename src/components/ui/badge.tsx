import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-surface-overlay text-content-secondary",
        success: "bg-success/15 text-success",
        warning: "bg-warning/15 text-warning",
        danger: "bg-danger/15 text-danger",
        accent: "bg-accent/15 text-accent-hover",
        ai: "bg-ai/15 text-ai",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/** Map common status strings to badge variants. */
export function statusVariant(status: string): BadgeProps["variant"] {
  const s = status.toUpperCase();
  if (["ACTIVE", "CONNECTED", "COMPLETED", "SUCCEEDED", "PUBLISHED", "READY"].includes(s))
    return "success";
  if (["PAUSED", "PENDING", "PENDING_APPROVAL", "QUEUED", "DELAYED", "DRAFT"].includes(s))
    return "warning";
  if (["ERROR", "FAILED", "EXPIRED", "TIMED_OUT", "ABORTED", "REJECTED"].includes(s))
    return "danger";
  return "neutral";
}
