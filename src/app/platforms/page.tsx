'use client';

import { useState } from 'react';
import { Check, ExternalLink, Settings, RefreshCw, AlertCircle } from 'lucide-react';
import { platformMetrics } from '@/data/mock';
import { formatCurrency, formatNumber, getPlatformBgClass, getPlatformName, cn } from '@/lib/utils';
import { Platform } from '@/types';

interface PlatformConfig {
  platform: Platform;
  connected: boolean;
  lastSync: string;
  accountName: string;
  accountId: string;
  features: string[];
}

const platformConfigs: PlatformConfig[] = [
  {
    platform: 'facebook',
    connected: true,
    lastSync: '2 minutes ago',
    accountName: 'Business Account',
    accountId: 'act_123456789',
    features: ['Campaign Management', 'Audience Insights', 'Pixel Tracking', 'Conversion API'],
  },
  {
    platform: 'tiktok',
    connected: true,
    lastSync: '5 minutes ago',
    accountName: 'TikTok Business',
    accountId: 'tt_987654321',
    features: ['Campaign Management', 'Spark Ads', 'Pixel Tracking', 'Audience Insights'],
  },
  {
    platform: 'google',
    connected: true,
    lastSync: '1 minute ago',
    accountName: 'Google Ads Main',
    accountId: '123-456-7890',
    features: ['Search Ads', 'Display Network', 'Shopping Ads', 'YouTube Ads', 'Conversion Tracking'],
  },
  {
    platform: 'snapchat',
    connected: true,
    lastSync: '10 minutes ago',
    accountName: 'Snap Business',
    accountId: 'snap_456789',
    features: ['Story Ads', 'AR Lens Ads', 'Snap Pixel', 'Audience Targeting'],
  },
];

export default function PlatformsPage() {
  const [configs, setConfigs] = useState(platformConfigs);

  const toggleConnection = (platform: Platform) => {
    setConfigs(prev => prev.map(c =>
      c.platform === platform ? { ...c, connected: !c.connected } : c
    ));
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Platform Integrations</h1>
        <p className="text-text-muted text-sm mt-1">Manage your ad platform connections and sync settings</p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {configs.map(config => {
          const metrics = platformMetrics.find(p => p.platform === config.platform);
          return (
            <div key={config.platform} className={cn(
              'bg-surface rounded-xl border p-5 transition-all',
              config.connected ? 'border-border hover:border-primary/30' : 'border-red-500/20 opacity-75'
            )}>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${getPlatformBgClass(config.platform)}`}>
                  {getPlatformName(config.platform)}
                </span>
                {config.connected ? (
                  <span className="flex items-center gap-1 text-emerald-400 text-xs">
                    <Check className="w-3 h-3" /> Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-400 text-xs">
                    <AlertCircle className="w-3 h-3" /> Disconnected
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Account</span>
                  <span className="text-text-secondary">{config.accountName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">ID</span>
                  <span className="text-text-secondary font-mono">{config.accountId}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Last Sync</span>
                  <span className="text-text-secondary">{config.lastSync}</span>
                </div>
                {metrics && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted">Active Campaigns</span>
                      <span className="text-text-primary font-medium">{metrics.campaigns}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted">Total Spend</span>
                      <span className="text-text-primary font-medium">{formatCurrency(metrics.totalSpend)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 bg-surface-hover hover:bg-background text-text-secondary text-xs py-2 rounded-lg transition-colors">
                  <RefreshCw className="w-3 h-3" /> Sync
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 bg-surface-hover hover:bg-background text-text-secondary text-xs py-2 rounded-lg transition-colors">
                  <Settings className="w-3 h-3" /> Config
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Platform Settings */}
      <div className="space-y-4">
        {configs.map(config => (
          <div key={config.platform} className="bg-surface rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${getPlatformBgClass(config.platform)}`}>
                  {getPlatformName(config.platform)}
                </span>
                <span className="text-xs text-text-muted">Integration Settings</span>
              </div>
              <div className="flex items-center gap-3">
                <button className="text-xs text-primary hover:text-primary-hover flex items-center gap-1 transition-colors">
                  <ExternalLink className="w-3 h-3" /> Open Platform
                </button>
                <button
                  onClick={() => toggleConnection(config.platform)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-lg font-medium transition-colors',
                    config.connected
                      ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  )}
                >
                  {config.connected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {config.features.map(feature => (
                <div key={feature} className="flex items-center gap-2 bg-background rounded-lg p-3">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs text-text-secondary">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
