import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Empty states are designed, not defaulted: each one names what's missing and
 * offers the single next action that fixes it.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid-lines flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-raised/40 text-center",
        compact ? "px-6 py-10" : "px-6 py-16",
        className
      )}
    >
      <div className="relative flex size-11 items-center justify-center rounded-full border border-border bg-surface-overlay">
        <Icon className="size-[1.125rem] text-ink-tertiary" aria-hidden />
      </div>
      <h3 className="mt-4 font-display text-[0.9375rem] font-medium text-ink">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-secondary">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
