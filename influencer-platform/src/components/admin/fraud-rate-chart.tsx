"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/ui/empty-state";
import { ShieldCheck } from "lucide-react";

const AXIS = { stroke: "#666D7E", fontSize: 11 };

export function FraudRateChart({
  data,
}: {
  data: { day: string; raised: number; cleared: number }[];
}) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="No flags raised yet"
        description="Once the fraud rules fire on real traffic, the daily raised-versus-cleared breakdown appears here."
        compact
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#232834" vertical={false} />
        <XAxis
          dataKey="day"
          tickFormatter={(v: string) =>
            new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
            }).format(new Date(v))
          }
          tickLine={false}
          axisLine={false}
          tick={AXIS}
          minTickGap={24}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tick={AXIS}
          width={40}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
          contentStyle={{
            background: "#161922",
            border: "1px solid #232834",
            borderRadius: "0.5rem",
            fontSize: "0.8125rem",
          }}
          labelStyle={{ color: "#9BA1B0" }}
        />
        <Legend
          wrapperStyle={{ fontSize: "0.75rem", color: "#9BA1B0" }}
          iconType="circle"
          iconSize={8}
        />
        <Bar
          dataKey="raised"
          name="Flags raised"
          fill="#FF5C6C"
          radius={[3, 3, 0, 0]}
          maxBarSize={28}
        />
        <Bar
          dataKey="cleared"
          name="Cleared on review"
          fill="#2FD98A"
          radius={[3, 3, 0, 0]}
          maxBarSize={28}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
