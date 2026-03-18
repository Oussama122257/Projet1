'use client';

import { useState } from 'react';
import { Plus, Filter, Search, ArrowUpDown, MoreHorizontal, Play, Pause, Eye } from 'lucide-react';
import { campaigns } from '@/data/mock';
import { Platform, CampaignStatus } from '@/types';
import { formatCurrency, formatNumber, formatPercent, getPlatformBgClass, getPlatformName, getStatusColor, cn } from '@/lib/utils';

export default function CampaignsPage() {
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'spent' | 'roas' | 'conversions'>('roas');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = campaigns
    .filter(c => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (platformFilter !== 'all' && c.platform !== platformFilter) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const mult = sortDir === 'desc' ? -1 : 1;
      if (sortBy === 'name') return mult * a.name.localeCompare(b.name);
      return mult * ((a[sortBy] as number) - (b[sortBy] as number));
    });

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Campaigns</h1>
          <p className="text-text-muted text-sm mt-1">{campaigns.length} campaigns across {4} platforms</p>
        </div>
        <button className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-surface rounded-xl border border-border p-4">
        <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 flex-1 min-w-[200px] border border-border">
          <Search className="w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search campaigns..."
            className="bg-transparent text-sm text-text-primary outline-none w-full placeholder:text-text-muted"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none"
          value={platformFilter}
          onChange={e => setPlatformFilter(e.target.value as Platform | 'all')}
        >
          <option value="all">All Platforms</option>
          <option value="facebook">Facebook</option>
          <option value="tiktok">TikTok</option>
          <option value="google">Google</option>
          <option value="snapchat">Snapchat</option>
        </select>
        <select
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as CampaignStatus | 'all')}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-text-muted px-5 py-3 uppercase tracking-wider">
                  <button onClick={() => toggleSort('name')} className="flex items-center gap-1 hover:text-text-secondary">
                    Campaign <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left text-xs font-medium text-text-muted px-5 py-3 uppercase tracking-wider">Platform</th>
                <th className="text-left text-xs font-medium text-text-muted px-5 py-3 uppercase tracking-wider">Status</th>
                <th className="text-right text-xs font-medium text-text-muted px-5 py-3 uppercase tracking-wider">
                  <button onClick={() => toggleSort('spent')} className="flex items-center gap-1 ml-auto hover:text-text-secondary">
                    Spent <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-right text-xs font-medium text-text-muted px-5 py-3 uppercase tracking-wider">Budget</th>
                <th className="text-right text-xs font-medium text-text-muted px-5 py-3 uppercase tracking-wider">Impressions</th>
                <th className="text-right text-xs font-medium text-text-muted px-5 py-3 uppercase tracking-wider">Clicks</th>
                <th className="text-right text-xs font-medium text-text-muted px-5 py-3 uppercase tracking-wider">
                  <button onClick={() => toggleSort('conversions')} className="flex items-center gap-1 ml-auto hover:text-text-secondary">
                    Conv. <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-right text-xs font-medium text-text-muted px-5 py-3 uppercase tracking-wider">CTR</th>
                <th className="text-right text-xs font-medium text-text-muted px-5 py-3 uppercase tracking-wider">CPC</th>
                <th className="text-right text-xs font-medium text-text-muted px-5 py-3 uppercase tracking-wider">
                  <button onClick={() => toggleSort('roas')} className="flex items-center gap-1 ml-auto hover:text-text-secondary">
                    ROAS <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-right text-xs font-medium text-text-muted px-5 py-3 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-surface-hover transition-colors group">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-text-primary">{c.name}</p>
                    <p className="text-xs text-text-muted">{c.startDate} → {c.endDate}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getPlatformBgClass(c.platform)}`}>
                      {getPlatformName(c.platform)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${getStatusColor(c.status)}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-sm text-text-primary font-medium">{formatCurrency(c.spent)}</td>
                  <td className="px-5 py-4 text-right text-sm text-text-muted">{formatCurrency(c.budget)}</td>
                  <td className="px-5 py-4 text-right text-sm text-text-secondary">{formatNumber(c.impressions)}</td>
                  <td className="px-5 py-4 text-right text-sm text-text-secondary">{formatNumber(c.clicks)}</td>
                  <td className="px-5 py-4 text-right text-sm text-text-primary font-medium">{formatNumber(c.conversions)}</td>
                  <td className="px-5 py-4 text-right text-sm text-text-secondary">{formatPercent(c.ctr)}</td>
                  <td className="px-5 py-4 text-right text-sm text-text-secondary">{formatCurrency(c.cpc)}</td>
                  <td className="px-5 py-4 text-right">
                    <span className={cn(
                      'text-sm font-bold',
                      c.roas >= 5 ? 'text-emerald-400' : c.roas >= 3 ? 'text-amber-400' : c.roas > 0 ? 'text-red-400' : 'text-text-muted'
                    )}>
                      {c.roas > 0 ? c.roas + 'x' : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 rounded hover:bg-background text-text-muted hover:text-text-primary"><Eye className="w-4 h-4" /></button>
                      {c.status === 'active' && <button className="p-1.5 rounded hover:bg-background text-text-muted hover:text-amber-400"><Pause className="w-4 h-4" /></button>}
                      {c.status === 'paused' && <button className="p-1.5 rounded hover:bg-background text-text-muted hover:text-emerald-400"><Play className="w-4 h-4" /></button>}
                      <button className="p-1.5 rounded hover:bg-background text-text-muted hover:text-text-primary"><MoreHorizontal className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
