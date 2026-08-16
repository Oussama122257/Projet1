import { cn } from "@/lib/utils";

/**
 * Budget / threshold progress.
 *
 * Colour is driven by how close to the ceiling the value is, because on this
 * product "nearly at budget" is information the brand needs to act on, not
 * decoration.
 */
export function Progress({
  value,
  max = 100,
  className,
  tone,
  showOverflow = true,
}: {
  value: number;
  max?: number;
  className?: string;
  tone?: "accent" | "success" | "warning" | "danger";
  showOverflow?: boolean;
}) {
  const ratio = max > 0 ? value / max : 0;
  const pct = Math.min(100, Math.max(0, ratio * 100));

  const autoTone =
    ratio >= 1 ? "danger" : ratio >= 0.85 ? "warning" : "accent";
  const resolved = tone ?? autoTone;

  const fill = {
    accent: "bg-accent",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  }[resolved];

  return (
    <div
      className={cn(
        "relative h-1.5 w-full overflow-hidden rounded-full bg-surface-hover",
        className
      )}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", fill)}
        style={{ width: `${pct}%` }}
      />
      {showOverflow && ratio > 1 && (
        <div className="absolute inset-0 animate-pulse rounded-full ring-1 ring-inset ring-danger/50" />
      )}
    </div>
  );
}
