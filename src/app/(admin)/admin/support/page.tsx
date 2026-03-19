'use client';
import { useState } from 'react';
import { LifeBuoy, MessageSquare, Clock, CheckCircle, User } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { statusColor } from '@/lib/utils';

const tickets = [
  { id: 'T-1042', subject: 'Cannot connect Google Ads account', org: 'Local Bakery', assignee: 'Unassigned', status: 'open', priority: 'high', created: '2 hours ago' },
  { id: 'T-1041', subject: 'ROAS data not matching platform', org: 'TechFlow', assignee: 'Support Team', status: 'in_progress', priority: 'medium', created: '5 hours ago' },
  { id: 'T-1040', subject: 'Need help with API integration', org: 'BigRetail Inc', assignee: 'Dev Team', status: 'in_progress', priority: 'low', created: '1 day ago' },
  { id: 'T-1039', subject: 'Billing charge incorrect', org: 'FashionHub', assignee: 'Support Team', status: 'resolved', priority: 'high', created: '2 days ago' },
  { id: 'T-1038', subject: 'Feature request: Slack notifications', org: 'Acme Corp', assignee: 'Product Team', status: 'resolved', priority: 'low', created: '3 days ago' },
];

const priorityColor: Record<string, string> = {
  high: 'bg-red-500/20 text-red-400',
  medium: 'bg-amber-500/20 text-amber-400',
  low: 'bg-blue-500/20 text-blue-400',
};

export default function SupportPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const filtered = tickets.filter(t => statusFilter === 'all' || t.status === statusFilter);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold flex items-center gap-2"><LifeBuoy size={24} /> Support Tickets</h1>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2"><MessageSquare size={18} className="text-blue-400" /><span className="text-sm text-[var(--color-text-muted)]">Open Tickets</span></div>
          <p className="text-2xl font-bold">1</p>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2"><Clock size={18} className="text-amber-400" /><span className="text-sm text-[var(--color-text-muted)]">In Progress</span></div>
          <p className="text-2xl font-bold">2</p>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2"><CheckCircle size={18} className="text-emerald-400" /><span className="text-sm text-[var(--color-text-muted)]">Resolved (7d)</span></div>
          <p className="text-2xl font-bold">2</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Select
          options={[{ value: 'all', label: 'All Status' }, { value: 'open', label: 'Open' }, { value: 'in_progress', label: 'In Progress' }, { value: 'resolved', label: 'Resolved' }]}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        />
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              {['ID', 'Subject', 'Organization', 'Priority', 'Status', 'Assignee', 'Created', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-hover)]">
                <td className="px-5 py-3 text-sm font-mono text-[var(--color-text-muted)]">{t.id}</td>
                <td className="px-5 py-3 text-sm font-medium">{t.subject}</td>
                <td className="px-5 py-3 text-sm text-[var(--color-text-secondary)]">{t.org}</td>
                <td className="px-5 py-3"><Badge className={priorityColor[t.priority]}>{t.priority}</Badge></td>
                <td className="px-5 py-3"><Badge className={statusColor(t.status)}>{t.status.replace('_', ' ')}</Badge></td>
                <td className="px-5 py-3 text-sm text-[var(--color-text-secondary)]">
                  <div className="flex items-center gap-1"><User size={14} />{t.assignee}</div>
                </td>
                <td className="px-5 py-3 text-sm text-[var(--color-text-muted)]">{t.created}</td>
                <td className="px-5 py-3">
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost">Reply</Button>
                    {t.status !== 'resolved' && <Button size="sm" variant="ghost">Resolve</Button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
