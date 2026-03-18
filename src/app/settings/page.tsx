'use client';

import { useState } from 'react';
import { Save, Bell, Shield, Palette, Globe, Key, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-muted text-sm mt-1">Manage your account and application preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-48 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                activeTab === tab.id
                  ? 'bg-primary/15 text-primary'
                  : 'text-text-muted hover:text-text-secondary hover:bg-surface-hover'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-surface rounded-xl border border-border p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-text-primary">General Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Organization Name</label>
                  <input type="text" defaultValue="My Company" className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Default Currency</label>
                  <select className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary">
                    <option>USD ($)</option>
                    <option>EUR (&euro;)</option>
                    <option>GBP (&pound;)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Timezone</label>
                  <select className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary">
                    <option>UTC-5 (Eastern)</option>
                    <option>UTC-8 (Pacific)</option>
                    <option>UTC+0 (GMT)</option>
                    <option>UTC+1 (CET)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Data Refresh Interval</label>
                  <select className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary">
                    <option>Every 5 minutes</option>
                    <option>Every 15 minutes</option>
                    <option>Every hour</option>
                    <option>Manual only</option>
                  </select>
                </div>
              </div>
              <button className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-text-primary">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { label: 'Campaign performance alerts', desc: 'Get notified when KPIs drop below thresholds' },
                  { label: 'Budget alerts', desc: 'Notify when campaigns reach 80% of budget' },
                  { label: 'AI recommendations', desc: 'New optimization suggestions from AI' },
                  { label: 'Weekly performance reports', desc: 'Summary of all campaign performance' },
                  { label: 'Platform sync errors', desc: 'When data sync with ad platforms fails' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-background rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{item.label}</p>
                      <p className="text-xs text-text-muted mt-0.5">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={i < 3} className="sr-only peer" />
                      <div className="w-9 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-text-primary">API Keys</h2>
              <p className="text-sm text-text-muted">Manage API keys for platform integrations</p>
              <div className="space-y-3">
                {[
                  { name: 'Facebook Marketing API', status: 'active' },
                  { name: 'TikTok Marketing API', status: 'active' },
                  { name: 'Google Ads API', status: 'active' },
                  { name: 'Snapchat Marketing API', status: 'active' },
                ].map((key, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-background rounded-lg">
                    <div className="flex items-center gap-3">
                      <Key className="w-4 h-4 text-text-muted" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">{key.name}</p>
                        <p className="text-xs text-text-muted font-mono">••••••••••••••••</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Active</span>
                      <button className="text-xs text-primary hover:text-primary-hover transition-colors">Rotate</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(activeTab === 'team' || activeTab === 'security' || activeTab === 'appearance') && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                {activeTab === 'team' && <Users className="w-8 h-8 text-primary" />}
                {activeTab === 'security' && <Shield className="w-8 h-8 text-primary" />}
                {activeTab === 'appearance' && <Palette className="w-8 h-8 text-primary" />}
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-1">Coming Soon</h3>
              <p className="text-sm text-text-muted">This feature is currently in development.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
