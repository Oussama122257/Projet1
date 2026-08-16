import { cn } from "@/lib/utils";

/**
 * The mark is a closed loop with a break — content goes in, money comes out.
 */
export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        <path
          d="M11 2.5a8.5 8.5 0 1 0 8.34 10"
          stroke="#B25CFF"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx="11" cy="11" r="3.1" fill="#B25CFF" fillOpacity="0.32" />
        <circle cx="11" cy="11" r="1.5" fill="#B25CFF" />
      </svg>
      {showWordmark && (
        <span className="font-display text-[0.9375rem] font-semibold tracking-[-0.02em] text-ink">
          PayLoop
        </span>
      )}
    </span>
  );
}
