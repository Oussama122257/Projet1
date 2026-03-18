'use client';

import { DollarSign, Eye, MousePointer, ShoppingCart, TrendingUp, Target } from 'lucide-react';
import KPICard from '@/components/ui/KPICard';
import { campaigns, dailyMetrics, platformMetrics, recommendations } from '@/data/mock';
import { formatCurrency, formatNumber, getPlatformColor, getPlatformBgClass, getPlatformName, getStatusColor, cn } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import Link from 'next/link';

const COLORS = ['#6366f1', '#22d3ee', '#10b981', '#f59e0b'];

export default function DashboardPage() {
  const totalSpend = campaigns.filter(c => c.status !== 'draft').reduce((sum, c) => sum + c.spent, 0);
  const totalImpressions = campaigns.filter(c => c.status !== 'draft').reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = campaigns.filter(c => c.status !== 'draft').reduce((sum, c) => sum + c.clicks, 0);
  const totalConversions = campaigns.filter(c => c.status !== 'draft').reduce((sum, c) => sum + c.conversions, 0);
  const avgCTR = totalClicks / totalImpressions * 100;
  const avgROAS = campaigns.filter(c => c.roas > 0).reduce((sum, c) => sum + c.roas, 0) / campaigns.filter(c => c.roas > 0).length;

  const pieData = platformMetrics.map(p => ({
    name: getPlatformName(p.platform),
    value: p.totalSpend,
    platform: p.platform,
  }));

  const pendingRecs = recommendations.filter(r => r.status === 'pending');

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-muted text-sm mt-1">Overview of all your campaigns across platforms</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-text-muted">Last 30 days</span>
          <select className="bg-surface border border-border rounded-lg px-3 py-1.5 text-text-primary text-sm outline-none focus:border-primary">
            <option>Last 7 days</option>
            <option selected>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard label="Total Spend" value={formatCurrency(totalSpend)} change={12.5} icon={<DollarSign className="w-5 h-5" />} prefix="" />
        <KPICard label="Impressions" value={formatNumber(totalImpressions)} change={8.3} icon={<Eye className="w-5 h-5" />} />
        <KPICard label="Clicks" value={formatNumber(totalClicks)} change={15.2} icon={<MousePointer className="w-5 h-5" />} />
        <KPICard label="Conversions" value={formatNumber(totalConversions)} change={22.1} icon={<ShoppingCart className="w-5 h-5" />} />
        <KPICard label="Avg CTR" value={avgCTR.toFixed(2) + '%'} change={3.4} icon={<Target className="w-5 h-5" />} />
        <KPICard label="Avg ROAS" value={avgROAS.toFixed(1) + 'x'} change={5.8} icon={<TrendingUp className="w-5 h-5" />} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Spend Chart */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Revenue vs Spend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyMetrics}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e4a" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickFormatter={(v) => v.split('-')[2]} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: '#12122a', border: '1px solid #1e1e4a', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                <Area type="monotone" dataKey="spend" stroke="#22d3ee" fillOpacity={1} fill="url(#colorSpend)" name="Spend" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spend by Platform */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Spend by Platform</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={entry.platform} fill={getPlatformColor(entry.platform)} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#12122a', border: '1px solid #1e1e4a', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Conversions Bar Chart */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Daily Conversions</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e4a" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickFormatter={(v) => v.split('-')[2]} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ background: '#12122a', border: '1px solid #1e1e4a', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="conversions" fill="#6366f1" radius={[4, 4, 0, 0]} name="Conversions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Campaigns */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Top Campaigns by ROAS</h3>
            <Link href="/campaigns" className="text-xs text-primary hover:text-primary-hover transition-colors">View All</Link>
          </div>
          <div className="space-y-3">
            {campaigns
              .filter(c => c.status === 'active')
              .sort((a, b) => b.roas - a.roas)
              .slice(0, 5)
              .map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-surface-hover transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-2 h-2 rounded-full', campaign.roas >= 5 ? 'bg-emerald-400' : campaign.roas >= 3 ? 'bg-amber-400' : 'bg-red-400')} />
                    <div>
                      <p className="text-sm font-medium text-text-primary">{campaign.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getPlatformBgClass(campaign.platform)}`}>
                        {getPlatformName(campaign.platform)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-text-primary">{campaign.roas}x</p>
                    <p className="text-xs text-text-muted">{formatCurrency(campaign.spent)} spent</p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* AI Recommendations Preview */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              AI Recommendations
            </h3>
            <Link href="/recommendations" className="text-xs text-primary hover:text-primary-hover transition-colors">View All</Link>
          </div>
          <div className="space-y-3">
            {pendingRecs.slice(0, 4).map((rec) => (
              <div key={rec.id} className="p-3 rounded-lg bg-background border border-border hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        'text-[10px] font-medium px-2 py-0.5 rounded-full uppercase',
                        rec.priority === 'high' ? 'bg-red-500/10 text-red-400' :
                        rec.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                      )}>{rec.priority}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${getPlatformBgClass(rec.platform)}`}>
                        {getPlatformName(rec.platform)}
                      </span>
                    </div>
                    <p className="text-sm text-text-primary">{rec.title}</p>
                    <p className="text-xs text-accent mt-1">{rec.expectedImpact}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
