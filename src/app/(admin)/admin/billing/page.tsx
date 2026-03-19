'use client';
import { CreditCard, AlertTriangle, RefreshCw, DollarSign } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

const subscriptions = [
  { org: 'Acme Corp', plan: 'Agency', amount: 299, status: 'active', syncStatus: 'synced' },
  { org: 'StartupXYZ', plan: 'Pro', amount: 99, status: 'trialing', syncStatus: 'synced' },
  { org: 'BigRetail Inc', plan: 'Agency', amount: 299, status: 'active', syncStatus: 'synced' },
  { org: 'Local Bakery', plan: 'Basic', amount: 29, status: 'past_due', syncStatus: 'failed' },
  { org: 'TechFlow', plan: 'Pro', amount: 99, status: 'active', syncStatus: 'synced' },
];

const failedPayments = [
  { org: 'Local Bakery', amount: 29, date: '2025-08-01', reason: 'Card declined', attempts: 3 },
];

export default function AdminBillingPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Billing Overview</h1>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2"><DollarSign size={18} className="text-emerald-400" /><span className="text-sm text-[var(--color-text-muted)]">Total MRR</span></div>
          <p className="text-2xl font-bold">$12,450</p>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2"><CreditCard size={18} className="text-[var(--color-primary)]" /><span className="text-sm text-[var(--color-text-muted)]">Active Subscriptions</span></div>
          <p className="text-2xl font-bold">38</p>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle size={18} className="text-red-400" /><span className="text-sm text-[var(--color-text-muted)]">Failed Payments</span></div>
          <p className="text-2xl font-bold text-red-400">1</p>
        </div>
      </div>

      {/* Subscriptions */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
        <div className="p-5 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold">All Subscriptions</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              {['Organization', 'Plan', 'Amount', 'Status', 'Sync'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((s, i) => (
              <tr key={i} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-hover)]">
                <td className="px-5 py-3 text-sm font-medium">{s.org}</td>
                <td className="px-5 py-3 text-sm">{s.plan}</td>
                <td className="px-5 py-3 text-sm">${s.amount}/mo</td>
                <td className="px-5 py-3">
                  <Badge className={s.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : s.status === 'trialing' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-red-500/20 text-red-400'}>
                    {s.status}
                  </Badge>
                </td>
                <td className="px-5 py-3">
                  <Badge className={s.syncStatus === 'synced' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
                    {s.syncStatus}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Failed payments */}
      <div className="bg-[var(--color-surface)] border border-red-500/20 rounded-xl">
        <div className="p-5 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-red-400">Failed Payments</h2>
        </div>
        <div className="p-5 space-y-3">
          {failedPayments.map((p, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-lg">
              <div>
                <p className="text-sm font-medium">{p.org}</p>
                <p className="text-xs text-[var(--color-text-muted)]">${p.amount} &middot; {p.date} &middot; {p.reason} &middot; {p.attempts} attempts</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline"><RefreshCw size={14} /> Retry</Button>
                <Button size="sm" variant="ghost">Refund</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
