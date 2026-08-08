"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Wilaya "heatmap": horizontal bar distribution of sales across Algeria —
 * readable at 58 values where a geographic map would be noise on mobile.
 */
export function WilayaHeatmap({ data }: { data: Array<{ wilaya: string; orders: number }> }) {
  const sorted = [...data].sort((a, b) => b.orders - a.orders).slice(0, 12);
  return (
    <ResponsiveContainer width="100%" height={Math.max(240, sorted.length * 32)}>
      <BarChart data={sorted} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8E2D0" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#5C6B80" }} />
        <YAxis type="category" dataKey="wilaya" width={110} tick={{ fontSize: 12, fill: "#0A2647" }} />
        <Tooltip
          cursor={{ fill: "rgba(232,185,49,0.1)" }}
          contentStyle={{ borderRadius: 12, border: "1px solid #E8E2D0" }}
        />
        <Bar dataKey="orders" name="Commandes" fill="#E8B931" radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RevenueChart({ data }: { data: Array<{ day: string; revenue: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D0" />
        <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#5C6B80" }} />
        <YAxis tick={{ fontSize: 12, fill: "#5C6B80" }} />
        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E8E2D0" }} />
        <Line
          type="monotone"
          dataKey="revenue"
          name="Revenu (DA)"
          stroke="#0A2647"
          strokeWidth={2.5}
          dot={{ fill: "#E8B931", r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
