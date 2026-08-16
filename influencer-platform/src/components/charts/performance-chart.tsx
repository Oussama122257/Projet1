"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCount, formatDateTime, formatMoney } from "@/lib/utils";

export type SeriesPoint = {
  capturedAt: string | Date;
  views: number;
  clicks: number;
  earningsCents: number;
};

const AXIS = { stroke: "#666D7E", fontSize: 11 };

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string; dataKey: string }[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border border-border bg-surface-overlay/95 px-3 py-2 shadow-card backdrop-blur">
      <p className="text-xs text-ink-tertiary">
        {label ? formatDateTime(new Date(label)) : ""}
      </p>
      <div className="mt-1.5 space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
            <span
              className="size-2 rounded-full"
              style={{ background: entry.color }}
              aria-hidden
            />
            <span className="text-ink-secondary">{entry.name}</span>
            <span className="tabular ml-auto font-medium text-ink">
              {entry.dataKey === "earningsCents"
                ? formatMoney(entry.value)
                : formatCount(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Views over time with earnings on a secondary axis.
 *
 * Views are the area (the volume story) and earnings the line (the money story)
 * — two encodings so the eye can separate them without a legend lookup.
 */
export function PerformanceChart({
  data,
  height = 260,
  showEarnings = true,
}: {
  data: SeriesPoint[];
  height?: number;
  showEarnings?: boolean;
}) {
  const points = data.map((d) => ({
    ...d,
    capturedAt: new Date(d.capturedAt).getTime(),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <defs>
          <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B25CFF" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#B25CFF" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#232834"
          vertical={false}
        />
        <XAxis
          dataKey="capturedAt"
          type="number"
          domain={["dataMin", "dataMax"]}
          scale="time"
          tickFormatter={(v) =>
            new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
            }).format(new Date(v))
          }
          tickLine={false}
          axisLine={false}
          tick={AXIS}
          minTickGap={32}
        />
        <YAxis
          yAxisId="views"
          tickFormatter={(v) => formatCount(v)}
          tickLine={false}
          axisLine={false}
          tick={AXIS}
          width={52}
        />
        {showEarnings && (
          <YAxis
            yAxisId="earnings"
            orientation="right"
            tickFormatter={(v) => formatMoney(v, { compact: true })}
            tickLine={false}
            axisLine={false}
            tick={AXIS}
            width={56}
          />
        )}
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#3A4152" }} />

        <Area
          yAxisId="views"
          type="monotone"
          dataKey="views"
          name="Views"
          stroke="#B25CFF"
          strokeWidth={1.75}
          fill="url(#viewsFill)"
          dot={false}
          activeDot={{ r: 3.5, strokeWidth: 0 }}
        />
        {showEarnings && (
          <Line
            yAxisId="earnings"
            type="monotone"
            dataKey="earningsCents"
            name="Earnings"
            stroke="#2FD98A"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
