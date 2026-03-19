'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, Users, CreditCard, Link2, UserCheck, Ban, Clock, Zap } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { tenants } from '@/data/mock';
import { statusColor } from '@/lib/utils';

export default function TenantDetailPage() {
  const { id } = useParams();
  const tenant = tenants.find(t => t.id === id) || tenants[0];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/admin/tenants" className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)]">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{tenant.orgName}</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{tenant.ownerEmail}</p>
        </div>
        <Badge className={statusColor(tenant.status)}>{tenant.status.replace('_', ' ')}</Badge>
      </div>

      <div className="grid sm:grid-cols-4 gap-4">
        {[
          { icon: Building2, label: 'Plan', value: tenant.plan, color: 'var(--color-primary)' },
          { icon: Users, label: 'Members', value: tenant.memberCount.toString(), color: '#22d3ee' },
          { icon: Link2, label: 'Ad Accounts', value: tenant.adAccountCount.toString(), color: '#10b981' },
          { icon: CreditCard, label: 'MRR', value: `$${tenant.mrr}`, color: '#f59e0b' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} style={{ color: item.color }} />
                <span className="text-xs text-[var(--color-text-muted)]">{item.label}</span>
              </div>
              <p className="text-xl font-bold capitalize">{item.value}</p>
            </div>
          );
        })}
      </div>

      {/* Members */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">Members</h2>
        <div className="space-y-3">
          {['Sarah Chen (Owner)', 'Mike Rodriguez (Admin)', 'Emily Park (Member)'].map((m, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-[var(--color-background)] rounded-lg border border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold">
                  {m.split(' ').slice(0, 2).map(n => n[0]).join('')}
                </div>
                <span className="text-sm">{m}</span>
              </div>
              <Button size="sm" variant="ghost"><UserCheck size={14} /> Impersonate</Button>
            </div>
          ))}
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">Connected Ad Accounts</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { name: 'Google Ads - Main', color: '#4285f4' },
            { name: 'Meta Business - Corp', color: '#1877f2' },
            { name: 'TikTok - Official', color: '#ff0050' },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-[var(--color-background)] rounded-lg border border-[var(--color-border)]">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: a.color + '20' }}>
                <Zap size={14} style={{ color: a.color }} />
              </div>
              <span className="text-sm">{a.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline"><Clock size={14} /> Extend Trial</Button>
          <Button variant="outline"><CreditCard size={14} /> Adjust Plan</Button>
          <Button variant="destructive"><Ban size={14} /> Suspend Organization</Button>
        </div>
      </div>
    </div>
  );
}
