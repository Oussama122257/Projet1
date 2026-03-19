'use client';
import { useState } from 'react';
import Link from 'next/link';
import { DollarSign, Eye, MousePointer, Target, Sparkles, Plus, FileText, UserPlus, ArrowRight, Check, X } from 'lucide-react';
import KPICard from '@/components/ui/KPICard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import PerformanceChart from '@/components/charts/PerformanceChart';
import { campaigns, recommendations } from '@/data/mock';
import { formatCurrency, formatNumber, platformColor, statusColor } from '@/lib/utils';

const dateRanges = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
];

const platformFilters = [
  { value: 'all', label: 'All Platforms' },
  { value: 'google', label: 'Google' },
  { value: 'meta', label: 'Meta' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'snapchat', label: 'Snapchat' },
];

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState('7d');
  const [platform, setPlatform] = useState('all');
  const [recs, setRecs] = useState(recommendations.slice(0, 3));

  const filteredCampaigns = campaigns.filter(c => platform === 'all' || c.platform === platform);
  const totalSpend = filteredCampaigns.reduce((a, c) => a + c.spend, 0);
  const totalImpressions = filteredCampaigns.reduce((a, c) => a + c.impressions, 0);
  const totalClicks = filteredCampaigns.reduce((a, c) => a + c.clicks, 0);
  const totalConversions = filteredCampaigns.reduce((a, c) => a + c.conversions, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Trial banner */}
      <div className="bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 border border-[var(--color-primary)]/20 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles size={20} className="text-[var(--color-accent)]" />
          <span className="text-sm"><strong>12 days left</strong> on your free trial. Add a payment method to keep access.</span>
        </div>
        <Link href="/billing"><Button size="sm">Upgrade now</Button></Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Spend" value={formatCurrency(totalSpend)} change={8.2} icon={<DollarSign size={18} />} />
        <KPICard label="Impressions" value={formatNumber(totalImpressions)} change={12.5} icon={<Eye size={18} />} />
        <KPICard label="Clicks" value={formatNumber(totalClicks)} change={-3.1} icon={<MousePointer size={18} />} />
        <KPICard label="Conversions" value={formatNumber(totalConversions)} change={15.8} icon={<Target size={18} />} />
      </div>

      {/* Chart section */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold">Performance Overview</h2>
          <div className="flex gap-2">
            <Select options={dateRanges} value={dateRange} onChange={e => setDateRange(e.target.value)} />
            <Select options={platformFilters} value={platform} onChange={e => setPlatform(e.target.value)} />
          </div>
        </div>
        <PerformanceChart />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Campaign table */}
        <div className="lg:col-span-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
            <h2 className="text-lg font-semibold">Campaign Performance</h2>
            <Link href="/campaigns"><Button variant="ghost" size="sm">View all <ArrowRight size={14} /></Button></Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {['Campaign', 'Platform', 'Status', 'Spend', 'Clicks', 'Conv.', 'ROAS'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.slice(0, 6).map(c => (
                  <tr key={c.id} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer">
                    <td className="px-5 py-3">
                      <Link href={`/campaigns/${c.id}`} className="font-medium text-sm hover:text-[var(--color-primary)]">{c.name}</Link>
                    </td>
                    <td className="px-5 py-3"><Badge className={platformColor(c.platform)}>{c.platform}</Badge></td>
                    <td className="px-5 py-3"><Badge className={statusColor(c.status)}>{c.status}</Badge></td>
                    <td className="px-5 py-3 text-sm">{formatCurrency(c.spend)}</td>
                    <td className="px-5 py-3 text-sm">{formatNumber(c.clicks)}</td>
                    <td className="px-5 py-3 text-sm">{formatNumber(c.conversions)}</td>
                    <td className="px-5 py-3 text-sm font-medium">{c.roas.toFixed(1)}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[var(--color-accent)]" />
              <h2 className="text-lg font-semibold">AI Recommendations</h2>
            </div>
            <Link href="/chat"><Button variant="ghost" size="sm">See all</Button></Link>
          </div>
          <div className="p-3 space-y-2">
            {recs.map(r => (
              <div key={r.id} className="p-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)]/20 transition-colors">
                <p className="text-sm mb-2">{r.message}</p>
                <p className="text-xs text-[var(--color-accent)] mb-3">{r.impact}</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setRecs(prev => prev.filter(x => x.id !== r.id))}>
                    <Check size={14} /> Apply
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setRecs(prev => prev.filter(x => x.id !== r.id))}>
                    <X size={14} /> Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Plus, label: 'Connect new ad account', href: '/settings', color: 'var(--color-primary)' },
          { icon: FileText, label: 'Generate report', href: '/reports', color: 'var(--color-accent)' },
          { icon: UserPlus, label: 'Invite team member', href: '/team', color: 'var(--color-success)' },
        ].map((a, i) => {
          const Icon = a.icon;
          return (
            <Link key={i} href={a.href} className="flex items-center gap-3 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:border-[var(--color-primary)]/30 transition-colors">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: a.color + '15' }}>
                <Icon size={20} style={{ color: a.color }} />
              </div>
              <span className="font-medium text-sm">{a.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
