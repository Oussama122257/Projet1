'use client';
import { useState } from 'react';
import { User, Bell, Link2, Key, Save, Trash2, RefreshCw, Zap, Copy } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import { statusColor } from '@/lib/utils';

const connectedAccounts = [
  { platform: 'Google Ads', accountName: 'Acme - Main', status: 'connected', color: '#4285f4' },
  { platform: 'Meta Ads', accountName: 'Acme Corp Business', status: 'connected', color: '#1877f2' },
  { platform: 'TikTok Ads', accountName: 'acme_official', status: 'connected', color: '#ff0050' },
  { platform: 'Snapchat Ads', accountName: 'AcmeCorp', status: 'expired', color: '#FFFC00' },
];

export default function SettingsPage() {
  const [tab, setTab] = useState('Profile');
  const [apiKey] = useState('sk_live_adpilot_xxxxxxxxxxxxxxxxxxxx');

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Tabs tabs={['Profile', 'Notifications', 'Connected Accounts', 'API Access']} active={tab} onChange={setTab} />

      {tab === 'Profile' && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 max-w-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xl font-bold">SC</div>
            <div>
              <Button variant="outline" size="sm">Change avatar</Button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="First name" defaultValue="Sarah" />
              <Input label="Last name" defaultValue="Chen" />
            </div>
            <Input label="Email" type="email" defaultValue="sarah@company.com" />
            <div className="border-t border-[var(--color-border)] pt-4 mt-4">
              <h3 className="text-sm font-semibold mb-3">Change Password</h3>
              <div className="space-y-3">
                <Input label="Current password" type="password" placeholder="Enter current password" />
                <Input label="New password" type="password" placeholder="Enter new password" />
                <Input label="Confirm new password" type="password" placeholder="Confirm new password" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button><Save size={14} /> Save changes</Button>
            </div>
          </div>
        </div>
      )}

      {tab === 'Notifications' && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 max-w-2xl">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Bell size={18} /> Notification Preferences</h2>
          <div className="space-y-4">
            {[
              { label: 'Daily performance summary', desc: 'Receive a daily email with key metrics', defaultChecked: true },
              { label: 'AI recommendation alerts', desc: 'Get notified when AI has new suggestions', defaultChecked: true },
              { label: 'Budget alerts', desc: 'Alert when campaigns approach budget limits', defaultChecked: true },
              { label: 'Team activity', desc: 'Notifications about team member actions', defaultChecked: false },
              { label: 'Billing reminders', desc: 'Payment and subscription notifications', defaultChecked: true },
            ].map((n, i) => (
              <label key={i} className="flex items-start justify-between gap-4 p-3 rounded-lg hover:bg-[var(--color-surface-hover)] cursor-pointer transition-colors">
                <div>
                  <p className="text-sm font-medium">{n.label}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{n.desc}</p>
                </div>
                <input type="checkbox" defaultChecked={n.defaultChecked} className="mt-1 accent-[var(--color-primary)]" />
              </label>
            ))}
            <div className="border-t border-[var(--color-border)] pt-4">
              <h3 className="text-sm font-semibold mb-3">Integrations</h3>
              <div className="space-y-2">
                <Button variant="outline" size="sm">Connect Slack</Button>
                <p className="text-xs text-[var(--color-text-muted)]">Send notifications to a Slack channel</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Connected Accounts' && (
        <div className="space-y-4 max-w-2xl">
          {connectedAccounts.map((a, i) => (
            <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: a.color + '20' }}>
                  <Zap size={18} style={{ color: a.color }} />
                </div>
                <div>
                  <p className="font-medium text-sm">{a.platform}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{a.accountName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={statusColor(a.status)}>{a.status}</Badge>
                {a.status === 'expired' ? (
                  <Button size="sm" variant="outline"><RefreshCw size={14} /> Reconnect</Button>
                ) : (
                  <Button size="sm" variant="ghost" className="text-red-400">Disconnect</Button>
                )}
              </div>
            </div>
          ))}
          <Button variant="outline"><Link2 size={14} /> Connect new platform</Button>
        </div>
      )}

      {tab === 'API Access' && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Key size={18} />
            <h2 className="text-lg font-semibold">API Key Management</h2>
          </div>
          <div className="p-4 bg-[var(--color-background)] rounded-lg border border-[var(--color-border)] flex items-center justify-between mb-4">
            <code className="text-sm text-[var(--color-text-secondary)] font-mono">{apiKey}</code>
            <Button size="sm" variant="ghost"><Copy size={14} /></Button>
          </div>
          <div className="flex gap-2 mb-6">
            <Button variant="outline" size="sm">Generate new key</Button>
            <Button variant="ghost" size="sm" className="text-red-400"><Trash2 size={14} /> Revoke key</Button>
          </div>
          <div className="p-4 bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-lg">
            <p className="text-sm font-medium text-[var(--color-primary)] mb-1">API Documentation</p>
            <p className="text-xs text-[var(--color-text-secondary)]">Learn how to integrate AdPilot with your applications using our REST API.</p>
            <Button variant="outline" size="sm" className="mt-3">View documentation</Button>
          </div>
        </div>
      )}
    </div>
  );
}
