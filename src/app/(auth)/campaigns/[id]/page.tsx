'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Edit2, DollarSign, TrendingUp, Target, Radio, Sparkles, Check, Image, Video, LayoutGrid, ThumbsUp, MessageSquare } from 'lucide-react';
import KPICard from '@/components/ui/KPICard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';
import PerformanceChart from '@/components/charts/PerformanceChart';
import { campaigns, adSets, ads, recommendations } from '@/data/mock';
import { formatCurrency, formatNumber, platformColor, statusColor } from '@/lib/utils';

export default function CampaignDetailPage() {
  const { id } = useParams();
  const campaign = campaigns.find(c => c.id === id) || campaigns[0];
  const campaignAdSets = adSets.filter(a => a.campaignId === campaign.id);
  const campaignAds = ads.filter(a => a.campaignId === campaign.id);
  const campaignRecs = recommendations.filter(r => r.campaignId === campaign.id);
  const [tab, setTab] = useState('Ad Sets');
  const [comment, setComment] = useState('');

  const typeIcon = (type: string) => {
    if (type === 'video') return <Video size={16} className="text-purple-400" />;
    if (type === 'carousel') return <LayoutGrid size={16} className="text-blue-400" />;
    return <Image size={16} className="text-green-400" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/campaigns" className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{campaign.name}</h1>
              <Badge className={platformColor(campaign.platform)}>{campaign.platform}</Badge>
              <Badge className={statusColor(campaign.status)}>{campaign.status}</Badge>
              {campaign.aiOptimized && <Badge className="bg-cyan-500/20 text-cyan-400"><Sparkles size={12} className="mr-1" /> AI Optimized</Badge>}
            </div>
          </div>
        </div>
        <Button variant="outline"><Edit2 size={14} /> Edit Campaign</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Spend" value={formatCurrency(campaign.spend)} change={5.2} icon={<DollarSign size={18} />} />
        <KPICard label="ROAS" value={`${campaign.roas.toFixed(1)}x`} change={8.3} icon={<TrendingUp size={18} />} />
        <KPICard label="CPA" value={formatCurrency(campaign.cpa)} change={-2.1} icon={<Target size={18} />} />
        <KPICard label="Frequency" value={campaign.frequency.toFixed(1)} change={1.5} icon={<Radio size={18} />} />
      </div>

      {/* Chart */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">Performance Over Time</h2>
        <PerformanceChart height={300} />
      </div>

      {/* Tabs: Ad Sets / Ads / Creatives */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
        <div className="p-5 border-b border-[var(--color-border)]">
          <Tabs tabs={['Ad Sets', 'Ads', 'Creatives']} active={tab} onChange={setTab} />
        </div>
        <div className="overflow-x-auto">
          {tab === 'Ad Sets' && (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {['Ad Set', 'Status', 'Spend', 'Impressions', 'Clicks', 'Conversions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaignAdSets.map(a => (
                  <tr key={a.id} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-hover)]">
                    <td className="px-5 py-3 text-sm font-medium">{a.name}</td>
                    <td className="px-5 py-3"><Badge className={statusColor(a.status)}>{a.status}</Badge></td>
                    <td className="px-5 py-3 text-sm">{formatCurrency(a.spend)}</td>
                    <td className="px-5 py-3 text-sm">{formatNumber(a.impressions)}</td>
                    <td className="px-5 py-3 text-sm">{formatNumber(a.clicks)}</td>
                    <td className="px-5 py-3 text-sm">{formatNumber(a.conversions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === 'Ads' && (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {['Ad', 'Type', 'Status', 'Spend', 'Clicks', 'Conv.', 'CTR', 'CPA'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaignAds.map(a => (
                  <tr key={a.id} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-hover)]">
                    <td className="px-5 py-3 text-sm font-medium">{a.name}</td>
                    <td className="px-5 py-3"><div className="flex items-center gap-2">{typeIcon(a.type)}<span className="text-sm capitalize">{a.type}</span></div></td>
                    <td className="px-5 py-3"><Badge className={statusColor(a.status)}>{a.status}</Badge></td>
                    <td className="px-5 py-3 text-sm">{formatCurrency(a.spend)}</td>
                    <td className="px-5 py-3 text-sm">{formatNumber(a.clicks)}</td>
                    <td className="px-5 py-3 text-sm">{formatNumber(a.conversions)}</td>
                    <td className="px-5 py-3 text-sm">{a.ctr.toFixed(2)}%</td>
                    <td className="px-5 py-3 text-sm">{formatCurrency(a.cpa)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === 'Creatives' && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 p-5">
              {campaignAds.map(a => (
                <div key={a.id} className="border border-[var(--color-border)] rounded-lg overflow-hidden hover:border-[var(--color-primary)]/30 transition-colors">
                  <div className="aspect-video bg-[var(--color-background)] flex items-center justify-center">
                    {typeIcon(a.type)}
                    <span className="ml-2 text-sm text-[var(--color-text-muted)] capitalize">{a.type}</span>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium mb-2">{a.name}</p>
                    <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)]">
                      <span>CTR: {a.ctr.toFixed(2)}%</span>
                      <span>CPA: {formatCurrency(a.cpa)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* AI Insights */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
          <div className="flex items-center gap-2 p-5 border-b border-[var(--color-border)]">
            <Sparkles size={18} className="text-[var(--color-accent)]" />
            <h2 className="text-lg font-semibold">AI Insights</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="p-4 rounded-lg bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/20">
              <p className="text-sm font-medium text-[var(--color-accent)] mb-1">Creative Analysis</p>
              <p className="text-sm text-[var(--color-text-secondary)]">Your video ad with testimonial style has 2x higher CTR. Try using more testimonials.</p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20">
              <p className="text-sm font-medium text-[var(--color-primary)] mb-1">Audience Insights</p>
              <p className="text-sm text-[var(--color-text-secondary)]">Users aged 25-34 convert best. Consider increasing bid for this age group.</p>
            </div>
            {campaignRecs.map(r => (
              <div key={r.id} className="p-4 rounded-lg border border-[var(--color-border)]">
                <p className="text-sm mb-2">{r.message}</p>
                <p className="text-xs text-[var(--color-accent)] mb-3">{r.impact}</p>
                <Button size="sm"><Check size={14} /> Apply</Button>
              </div>
            ))}
          </div>
        </div>

        {/* Comments */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
          <div className="flex items-center gap-2 p-5 border-b border-[var(--color-border)]">
            <MessageSquare size={18} />
            <h2 className="text-lg font-semibold">Comments</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold shrink-0">SC</div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">Sarah Chen</span>
                  <span className="text-xs text-[var(--color-text-muted)]">2 hours ago</span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">Let&apos;s increase the budget on this one. ROAS is looking great!</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0">MR</div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">Mike Rodriguez</span>
                  <span className="text-xs text-[var(--color-text-muted)]">1 hour ago</span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">Agreed! The testimonial creatives are performing well. @Emily can you create more?</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <input
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
              />
              <Button size="sm" disabled={!comment}>Send</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
