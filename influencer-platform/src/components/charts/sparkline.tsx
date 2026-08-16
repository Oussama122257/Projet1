import { cn } from "@/lib/utils";

/**
 * Inline sparkline for data tables.
 *
 * Pure SVG with no client JS: these appear dozens of times per table, and a
 * charting library per row would cost far more than it's worth. Trend direction
 * picks the stroke colour so a glance down the column reads as a column of
 * directions, not a column of squiggles.
 */
export function Sparkline({
  data,
  width = 96,
  height = 26,
  className,
  tone,
}: {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  tone?: "accent" | "success" | "danger" | "neutral";
}) {
  if (data.length < 2) {
    return (
      <div
        className={cn("flex items-center", className)}
        style={{ width, height }}
        aria-hidden
      >
        <div className="h-px w-full bg-surface-hover" />
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  // 2px inset top and bottom so the stroke isn't clipped at the extremes.
  const toY = (v: number) => height - 2 - ((v - min) / range) * (height - 4);

  const points = data.map((v, i) => `${(i * stepX).toFixed(2)},${toY(v).toFixed(2)}`);
  const line = `M ${points.join(" L ")}`;
  const area = `${line} L ${width},${height} L 0,${height} Z`;

  const rising = data[data.length - 1] >= data[0];
  const resolved = tone ?? (rising ? "accent" : "danger");
  const stroke = {
    accent: "#B25CFF",
    success: "#2FD98A",
    danger: "#FF5C6C",
    neutral: "#666D7E",
  }[resolved];

  const gradientId = `spark-${resolved}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      role="img"
      aria-label={`Trend: ${rising ? "up" : "down"}, latest ${data[data.length - 1].toLocaleString()}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={width}
        cy={toY(data[data.length - 1])}
        r="1.75"
        fill={stroke}
      />
    </svg>
  );
}
