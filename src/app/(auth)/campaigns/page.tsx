'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Plus, Pause, Play, Download, Sparkles } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { campaigns } from '@/data/mock';
import { formatCurrency, formatNumber, platformColor, statusColor } from '@/lib/utils';

export default function CampaignsPage() {
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = campaigns.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (platformFilter !== 'all' && c.platform !== platformFilter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleAll = () => {
    setSelected(prev => prev.length === filtered.length ? [] : filtered.map(c => c.id));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <Button><Plus size={16} /> Create Campaign</Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            placeholder="Search campaigns..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
          />
        </div>
        <Select
          options={[{ value: 'all', label: 'All Platforms' }, { value: 'google', label: 'Google' }, { value: 'meta', label: 'Meta' }, { value: 'tiktok', label: 'TikTok' }, { value: 'snapchat', label: 'Snapchat' }]}
          value={platformFilter}
          onChange={e => setPlatformFilter(e.target.value)}
        />
        <Select
          options={[{ value: 'all', label: 'All Status' }, { value: 'active', label: 'Active' }, { value: 'paused', label: 'Paused' }, { value: 'deleted', label: 'Deleted' }]}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        />
        <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
          <Filter size={14} />
          {filtered.length} campaigns
        </div>
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded-xl p-3 animate-slide-up">
          <span className="text-sm font-medium">{selected.length} selected</span>
          <Button size="sm" variant="outline"><Pause size={14} /> Pause</Button>
          <Button size="sm" variant="outline"><Play size={14} /> Resume</Button>
          <Button size="sm" variant="outline"><Download size={14} /> Export</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected([])}>Clear</Button>
        </div>
      )}

      {/* Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="px-5 py-3 text-left">
                <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} className="accent-[var(--color-primary)]" />
              </th>
              {['Campaign', 'Platform', 'Status', 'Budget', 'Spend', 'Impressions', 'Clicks', 'Conv.', 'ROAS', 'Start Date', ''].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-hover)] transition-colors">
                <td className="px-5 py-3">
                  <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)} className="accent-[var(--color-primary)]" />
                </td>
                <td className="px-5 py-3">
                  <Link href={`/campaigns/${c.id}`} className="font-medium text-sm hover:text-[var(--color-primary)] transition-colors flex items-center gap-2">
                    {c.name}
                    {c.aiOptimized && <Sparkles size={14} className="text-[var(--color-accent)]" />}
                  </Link>
                </td>
                <td className="px-5 py-3"><Badge className={platformColor(c.platform)}>{c.platform}</Badge></td>
                <td className="px-5 py-3"><Badge className={statusColor(c.status)}>{c.status}</Badge></td>
                <td className="px-5 py-3 text-sm">{formatCurrency(c.budget)}</td>
                <td className="px-5 py-3 text-sm">{formatCurrency(c.spend)}</td>
                <td className="px-5 py-3 text-sm">{formatNumber(c.impressions)}</td>
                <td className="px-5 py-3 text-sm">{formatNumber(c.clicks)}</td>
                <td className="px-5 py-3 text-sm">{formatNumber(c.conversions)}</td>
                <td className="px-5 py-3 text-sm font-medium">{c.roas.toFixed(1)}x</td>
                <td className="px-5 py-3 text-sm text-[var(--color-text-muted)]">{c.startDate}</td>
                <td className="px-5 py-3 text-sm">
                  <Link href={`/campaigns/${c.id}`}><Button size="sm" variant="ghost">View</Button></Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
