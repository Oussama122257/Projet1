'use client';

import { useState } from 'react';
import { campaigns, dailyMetrics, platformMetrics } from '@/data/mock';
import { Platform } from '@/types';
import { formatCurrency, formatNumber, formatPercent, getPlatformColor, getPlatformBgClass, getPlatformName, cn } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, Legend
} from 'recharts';

export default function AnalyticsPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all');

  const radarData = platformMetrics.map(p => ({
    platform: getPlatformName(p.platform).replace(' Ads', ''),
    CTR: p.avgCTR * 10,
    ROAS: p.avgROAS * 10,
    CPC: (1 - p.avgCPC) * 100,
    Conversions: p.totalConversions / 20,
    Reach: p.totalImpressions / 15000,
  }));

  const platformCompare = platformMetrics.map(p => ({
    platform: getPlatformName(p.platform).replace(' Ads', ''),
    spend: p.totalSpend,
    conversions: p.totalConversions,
    roas: p.avgROAS,
    ctr: p.avgCTR,
    cpc: p.avgCPC,
    color: getPlatformColor(p.platform),
  }));

  const funnelData = [
    { stage: 'Impressions', value: 3680000 },
    { stage: 'Clicks', value: 111090 },
    { stage: 'Conversions', value: 2985 },
    { stage: 'Revenue', value: 128400 },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
          <p className="text-text-muted text-sm mt-1">Deep dive into your campaign performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'facebook', 'tiktok', 'google', 'snapchat'] as const).map(p => (
            <button
              key={p}
              onClick={() => setSelectedPlatform(p)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                selectedPlatform === p
                  ? 'bg-primary/15 border-primary/30 text-primary'
                  : 'bg-surface border-border text-text-muted hover:text-text-secondary'
              )}
            >
              {p === 'all' ? 'All' : getPlatformName(p as Platform).replace(' Ads', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Platform Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {platformMetrics.map(p => (
          <div key={p.platform} className="bg-surface rounded-xl border border-border p-5 hover:border-primary/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getPlatformBgClass(p.platform)}`}>
                {getPlatformName(p.platform)}
              </span>
              <span className="text-xs text-text-muted">{p.campaigns} campaigns</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-muted">Spend</span>
                <span className="text-sm font-bold text-text-primary">{formatCurrency(p.totalSpend)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-muted">Conversions</span>
                <span className="text-sm font-bold text-text-primary">{formatNumber(p.totalConversions)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-muted">ROAS</span>
                <span className={cn('text-sm font-bold', p.avgROAS >= 4 ? 'text-emerald-400' : p.avgROAS >= 3 ? 'text-amber-400' : 'text-red-400')}>
                  {p.avgROAS}x
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-muted">CTR</span>
                <span className="text-sm font-bold text-text-primary">{formatPercent(p.avgCTR)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-muted">CPC</span>
                <span className="text-sm font-bold text-text-primary">{formatCurrency(p.avgCPC)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CTR Trend */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Click-Through Rate Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e4a" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickFormatter={(v) => v.split('-')[2]} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={v => v + '%'} />
                <Tooltip contentStyle={{ background: '#12122a', border: '1px solid #1e1e4a', borderRadius: '8px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="clicks" stroke="#6366f1" strokeWidth={2} dot={false} name="CTR %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Radar */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Platform Performance Radar</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1e1e4a" />
                <PolarAngleAxis dataKey="platform" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <PolarRadiusAxis tick={false} axisLine={false} />
                <Radar name="Performance" dataKey="CTR" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                <Radar name="ROAS" dataKey="ROAS" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.15} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversions Comparison */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Conversions by Platform</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformCompare} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e4a" />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="platform" type="category" stroke="#64748b" fontSize={11} width={80} />
                <Tooltip contentStyle={{ background: '#12122a', border: '1px solid #1e1e4a', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="conversions" fill="#6366f1" radius={[0, 4, 4, 0]} name="Conversions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funnel */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Conversion Funnel</h3>
          <div className="space-y-4 pt-4">
            {funnelData.map((stage, i) => {
              const width = i === 0 ? 100 : Math.max(20, (stage.value / funnelData[0].value) * 100);
              return (
                <div key={stage.stage} className="flex items-center gap-4">
                  <span className="text-xs text-text-muted w-24 text-right">{stage.stage}</span>
                  <div className="flex-1 h-10 bg-background rounded-lg overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-primary/40 to-primary rounded-lg flex items-center justify-end px-3 transition-all duration-500"
                      style={{ width: `${width}%` }}
                    >
                      <span className="text-xs font-bold text-white">
                        {stage.stage === 'Revenue' ? formatCurrency(stage.value) : formatNumber(stage.value)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
