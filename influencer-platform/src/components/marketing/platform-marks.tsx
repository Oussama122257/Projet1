import { Badge } from "@/components/ui/badge";

/**
 * Platform wordmarks with their integration status.
 *
 * The status is stated plainly rather than implying all three are live — TikTok
 * ships first for the Algeria launch market, and pretending otherwise would just
 * create support tickets.
 */
const PLATFORMS = [
  { name: "TikTok", color: "#25F4EE", status: "Live", tone: "success" as const },
  { name: "Instagram", color: "#E1306C", status: "Phase 2", tone: "neutral" as const },
  { name: "YouTube", color: "#FF0033", status: "Phase 2", tone: "neutral" as const },
];

export function PlatformMarks() {
  return (
    <div className="flex flex-col items-center gap-5">
      <p className="eyebrow">Tracks content on</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {PLATFORMS.map((platform) => (
          <div
            key={platform.name}
            className="flex items-center gap-2.5 rounded-full border border-border bg-surface-raised px-4 py-2"
          >
            <span
              className="size-2 rounded-full"
              style={{
                background: platform.color,
                boxShadow: `0 0 12px ${platform.color}55`,
              }}
              aria-hidden
            />
            <span className="font-display text-sm font-medium text-ink">
              {platform.name}
            </span>
            <Badge tone={platform.tone} className="ml-1">
              {platform.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
