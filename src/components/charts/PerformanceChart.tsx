'use client';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { chartData } from '@/data/mock';

const metrics = [
  { key: 'spend', label: 'Spend', color: '#6366f1' },
  { key: 'clicks', label: 'Clicks', color: '#22d3ee' },
  { key: 'conversions', label: 'Conversions', color: '#10b981' },
];

interface PerformanceChartProps {
  data?: typeof chartData;
  height?: number;
}

export default function PerformanceChart({ data = chartData, height = 350 }: PerformanceChartProps) {
  const [activeMetrics, setActiveMetrics] = useState(['spend', 'conversions']);

  const toggleMetric = (key: string) => {
    setActiveMetrics(prev =>
      prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]
    );
  };

  return (
    <div>
      <div className="flex gap-3 mb-4">
        {metrics.map(m => (
          <button
            key={m.key}
            onClick={() => toggleMetric(m.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeMetrics.includes(m.key)
                ? 'text-white'
                : 'bg-[var(--color-background)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
            }`}
            style={activeMetrics.includes(m.key) ? { backgroundColor: m.color + '33', color: m.color, border: `1px solid ${m.color}44` } : {}}
          >
            {m.label}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e4a" />
          <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip
            contentStyle={{ backgroundColor: '#12122a', border: '1px solid #1e1e4a', borderRadius: '8px', color: '#f1f5f9' }}
            labelFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}
          />
          <Legend />
          {metrics.filter(m => activeMetrics.includes(m.key)).map(m => (
            <Line key={m.key} type="monotone" dataKey={m.key} stroke={m.color} strokeWidth={2} dot={false} name={m.label} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
