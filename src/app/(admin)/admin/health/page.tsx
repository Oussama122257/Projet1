'use client';
import { Activity, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import Badge from '@/components/ui/Badge';

const syncJobs = [
  { platform: 'Google Ads', successRate: 99.2, lastRun: '2 min ago', status: 'healthy', jobsToday: 1240 },
  { platform: 'Meta Ads', successRate: 98.7, lastRun: '5 min ago', status: 'healthy', jobsToday: 980 },
  { platform: 'TikTok Ads', successRate: 95.1, lastRun: '3 min ago', status: 'degraded', jobsToday: 560 },
  { platform: 'Snapchat Ads', successRate: 97.8, lastRun: '8 min ago', status: 'healthy', jobsToday: 320 },
];

const errorLogs = [
  { type: 'API Rate Limit', platform: 'TikTok', count: 23, lastOccurrence: '15 min ago' },
  { type: 'Token Expired', platform: 'Meta', count: 5, lastOccurrence: '1 hour ago' },
  { type: 'Timeout', platform: 'Google', count: 3, lastOccurrence: '2 hours ago' },
  { type: 'Invalid Response', platform: 'Snapchat', count: 1, lastOccurrence: '6 hours ago' },
];

const statusIcon = (status: string) => {
  if (status === 'healthy') return <CheckCircle size={16} className="text-emerald-400" />;
  if (status === 'degraded') return <AlertTriangle size={16} className="text-amber-400" />;
  return <XCircle size={16} className="text-red-400" />;
};

export default function HealthPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Activity size={24} /> Platform Health</h1>

      {/* Sync Status */}
      <div className="grid sm:grid-cols-2 gap-4">
        {syncJobs.map((s, i) => (
          <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{s.platform}</h3>
              <div className="flex items-center gap-1.5">
                {statusIcon(s.status)}
                <span className="text-sm capitalize">{s.status}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-muted)]">Success rate</span>
                <span className={s.successRate > 97 ? 'text-emerald-400' : 'text-amber-400'}>{s.successRate}%</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--color-background)] rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${s.successRate > 97 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${s.successRate}%` }} />
              </div>
              <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                <span>Last run: {s.lastRun}</span>
                <span>{s.jobsToday} jobs today</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Queue depth */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">Queue Depth</h2>
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { label: 'Pending', value: 45, color: 'var(--color-primary)' },
            { label: 'Processing', value: 12, color: '#22d3ee' },
            { label: 'Completed (1h)', value: 340, color: '#10b981' },
            { label: 'Failed (1h)', value: 3, color: '#ef4444' },
          ].map((q, i) => (
            <div key={i} className="p-4 bg-[var(--color-background)] rounded-lg border border-[var(--color-border)] text-center">
              <p className="text-2xl font-bold" style={{ color: q.color }}>{q.value}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">{q.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Error logs */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
        <div className="p-5 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold">Error Logs (Grouped)</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              {['Error Type', 'Platform', 'Count', 'Last Occurrence'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {errorLogs.map((e, i) => (
              <tr key={i} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-hover)]">
                <td className="px-5 py-3 text-sm font-medium text-red-400">{e.type}</td>
                <td className="px-5 py-3 text-sm">{e.platform}</td>
                <td className="px-5 py-3"><Badge className="bg-red-500/20 text-red-400">{e.count}</Badge></td>
                <td className="px-5 py-3 text-sm text-[var(--color-text-muted)] flex items-center gap-1"><Clock size={14} /> {e.lastOccurrence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
