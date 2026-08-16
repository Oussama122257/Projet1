import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.6875rem] font-medium leading-5 whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "border-border bg-surface-overlay text-ink-secondary",
        accent: "border-accent/30 bg-accent-muted text-accent",
        success: "border-success/25 bg-success-muted text-success",
        warning: "border-warning/25 bg-warning-muted text-warning",
        danger: "border-danger/25 bg-danger-muted text-danger",
        info: "border-info/25 bg-info-muted text-info",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Renders a small filled dot before the label. */
  dot?: boolean;
}

export function Badge({ className, tone, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && (
        <span
          className="size-1.5 rounded-full bg-current opacity-80"
          aria-hidden
        />
      )}
      {children}
    </span>
  );
}

export { badgeVariants };
