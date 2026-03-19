'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { tenants } from '@/data/mock';
import { statusColor } from '@/lib/utils';

export default function TenantsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = tenants.filter(t => {
    if (search && !t.orgName.toLowerCase().includes(search.toLowerCase()) && !t.ownerEmail.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Tenants</h1>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            placeholder="Search by org name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
          />
        </div>
        <Select
          options={[{ value: 'all', label: 'All Status' }, { value: 'active', label: 'Active' }, { value: 'trialing', label: 'Trialing' }, { value: 'past_due', label: 'Past Due' }, { value: 'suspended', label: 'Suspended' }]}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        />
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              {['Organization', 'Owner', 'Plan', 'Status', 'Members', 'Ad Accounts', 'MRR', 'Created', ''].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-hover)]">
                <td className="px-5 py-3 text-sm font-medium">{t.orgName}</td>
                <td className="px-5 py-3 text-sm text-[var(--color-text-secondary)]">{t.ownerEmail}</td>
                <td className="px-5 py-3"><Badge className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] capitalize">{t.plan}</Badge></td>
                <td className="px-5 py-3"><Badge className={statusColor(t.status)}>{t.status.replace('_', ' ')}</Badge></td>
                <td className="px-5 py-3 text-sm">{t.memberCount}</td>
                <td className="px-5 py-3 text-sm">{t.adAccountCount}</td>
                <td className="px-5 py-3 text-sm font-medium">${t.mrr}</td>
                <td className="px-5 py-3 text-sm text-[var(--color-text-muted)]">{t.createdAt}</td>
                <td className="px-5 py-3">
                  <Link href={`/admin/tenants/${t.id}`}><Button size="sm" variant="ghost">View</Button></Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
