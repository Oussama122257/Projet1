import type { LucideIcon } from "lucide-react";
import { Counter } from "@/components/ui/counter";
import { Sparkline } from "@/components/charts/sparkline";
import { cn } from "@/lib/utils";

/**
 * Headline metric tile.
 *
 * Figures are tabular and count up on first view; the optional sparkline gives
 * the shape of the number's history without spending a full chart on it.
 */
export function Stat({
  label,
  value,
  format = "number",
  icon: Icon,
  hint,
  trend,
  accent,
  className,
}: {
  label: string;
  value: number;
  format?: "number" | "money";
  icon?: LucideIcon;
  hint?: string;
  trend?: number[];
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-surface-raised p-5 shadow-card",
        accent ? "border-accent/25" : "border-border",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.8125rem] text-ink-secondary">{label}</p>
        {Icon && (
          <Icon
            className={cn("size-4", accent ? "text-accent" : "text-ink-tertiary")}
            aria-hidden
          />
        )}
      </div>

      <p
        className={cn(
          "mt-3 font-display text-[1.75rem] font-semibold tracking-[-0.02em]",
          accent ? "text-accent" : "text-ink"
        )}
      >
        <Counter value={value} format={format} />
      </p>

      <div className="mt-3 flex items-end justify-between gap-3">
        {hint ? (
          <p className="text-xs text-ink-tertiary">{hint}</p>
        ) : (
          <span />
        )}
        {trend && trend.length > 1 && (
          <Sparkline
            data={trend}
            width={72}
            height={22}
            tone={accent ? "accent" : "neutral"}
          />
        )}
      </div>
    </div>
  );
}
