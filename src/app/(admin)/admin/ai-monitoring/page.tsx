'use client';
import { Brain, ThumbsUp, ThumbsDown, Clock, Zap, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import KPICard from '@/components/ui/KPICard';

const acceptanceData = [
  { week: 'W1', accepted: 45, dismissed: 12 },
  { week: 'W2', accepted: 52, dismissed: 15 },
  { week: 'W3', accepted: 48, dismissed: 10 },
  { week: 'W4', accepted: 61, dismissed: 8 },
];

const topSuggestions = [
  { type: 'Budget increase', count: 89, acceptance: 72 },
  { type: 'Pause underperforming', count: 67, acceptance: 85 },
  { type: 'Creative suggestion', count: 54, acceptance: 63 },
  { type: 'Audience optimization', count: 43, acceptance: 78 },
  { type: 'Dayparting adjustment', count: 31, acceptance: 81 },
];

const latencyData = [
  { model: 'Claude (insights)', avg: 1.2, p95: 2.8, p99: 4.1 },
  { model: 'Gemini (creative)', avg: 1.8, p95: 3.5, p99: 5.2 },
];

export default function AIMonitoringPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Brain size={24} /> AI Monitoring</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Acceptance Rate" value="78%" change={5.2} icon={<ThumbsUp size={18} />} />
        <KPICard label="Total Suggestions" value="284" change={12.1} icon={<Zap size={18} />} />
        <KPICard label="Avg Latency" value="1.5s" change={-8.3} icon={<Clock size={18} />} />
        <KPICard label="Positive Feedback" value="91%" change={3.1} icon={<TrendingUp size={18} />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">Recommendation Acceptance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={acceptanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e4a" />
              <XAxis dataKey="week" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#12122a', border: '1px solid #1e1e4a', borderRadius: '8px', color: '#f1f5f9' }} />
              <Bar dataKey="accepted" fill="#10b981" radius={[4, 4, 0, 0]} name="Accepted" />
              <Bar dataKey="dismissed" fill="#ef4444" radius={[4, 4, 0, 0]} name="Dismissed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">Most Common Suggestions</h2>
          <div className="space-y-3">
            {topSuggestions.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{s.type}</span>
                    <span className="text-[var(--color-text-muted)]">{s.count} total &middot; {s.acceptance}% accepted</span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--color-background)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--color-primary)] rounded-full" style={{ width: `${s.acceptance}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Latency */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">Model Latency</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                {['Model', 'Avg Latency', 'P95', 'P99'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {latencyData.map((l, i) => (
                <tr key={i} className="border-b border-[var(--color-border)]/50">
                  <td className="px-5 py-3 text-sm font-medium">{l.model}</td>
                  <td className="px-5 py-3 text-sm text-emerald-400">{l.avg}s</td>
                  <td className="px-5 py-3 text-sm text-amber-400">{l.p95}s</td>
                  <td className="px-5 py-3 text-sm text-red-400">{l.p99}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feedback */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">Feedback Summary</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-center">
            <ThumbsUp size={24} className="mx-auto mb-2 text-emerald-400" />
            <p className="text-2xl font-bold text-emerald-400">258</p>
            <p className="text-sm text-[var(--color-text-muted)]">Positive responses</p>
          </div>
          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg text-center">
            <ThumbsDown size={24} className="mx-auto mb-2 text-red-400" />
            <p className="text-2xl font-bold text-red-400">26</p>
            <p className="text-sm text-[var(--color-text-muted)]">Negative responses</p>
          </div>
        </div>
      </div>
    </div>
  );
}
