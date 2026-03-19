'use client';
import { useState } from 'react';
import { UserPlus, MoreVertical, Shield, Users as UsersIcon } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { teamMembers } from '@/data/mock';
import { statusColor } from '@/lib/utils';

const roleColors: Record<string, string> = {
  owner: 'bg-amber-500/20 text-amber-400',
  admin: 'bg-purple-500/20 text-purple-400',
  member: 'bg-blue-500/20 text-blue-400',
  viewer: 'bg-gray-500/20 text-gray-400',
};

export default function TeamPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');

  const filtered = teamMembers.filter(m => roleFilter === 'all' || m.role === roleFilter);
  const seatCount = teamMembers.filter(m => m.status === 'active').length;
  const seatLimit = 5;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Team</h1>
        <Button onClick={() => setInviteOpen(true)}><UserPlus size={16} /> Invite Member</Button>
      </div>

      {/* Seat meter */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <UsersIcon size={18} className="text-[var(--color-text-muted)]" />
            <span className="text-sm font-medium">Seat Usage</span>
          </div>
          <span className="text-sm text-[var(--color-text-secondary)]">{seatCount} of {seatLimit} seats used</span>
        </div>
        <div className="w-full h-2 bg-[var(--color-background)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--color-primary)] rounded-full transition-all" style={{ width: `${(seatCount / seatLimit) * 100}%` }} />
        </div>
        {seatCount >= seatLimit && (
          <p className="text-xs text-amber-400 mt-2">All seats used. <a href="/billing" className="underline">Upgrade your plan</a> for more seats.</p>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-3 items-center">
        <Select
          options={[{ value: 'all', label: 'All Roles' }, { value: 'owner', label: 'Owner' }, { value: 'admin', label: 'Admin' }, { value: 'member', label: 'Member' }, { value: 'viewer', label: 'Viewer' }]}
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        />
      </div>

      {/* Members table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              {['Member', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-hover)]">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold">
                      {m.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-sm font-medium">{m.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-[var(--color-text-secondary)]">{m.email}</td>
                <td className="px-5 py-3"><Badge className={roleColors[m.role]}><Shield size={12} className="mr-1" />{m.role}</Badge></td>
                <td className="px-5 py-3"><Badge className={statusColor(m.status)}>{m.status}</Badge></td>
                <td className="px-5 py-3 text-sm text-[var(--color-text-muted)]">{m.joinedAt}</td>
                <td className="px-5 py-3">
                  <button className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] cursor-pointer">
                    <MoreVertical size={16} className="text-[var(--color-text-muted)]" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Team settings */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">Team Settings</h2>
        <div className="space-y-4">
          <Select
            label="Default role for new members"
            options={[{ value: 'member', label: 'Member' }, { value: 'viewer', label: 'Viewer' }]}
          />
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="accent-[var(--color-primary)]" />
            <span className="text-sm text-[var(--color-text-secondary)]">Require admin approval for new platform connections</span>
          </label>
        </div>
      </div>

      {/* Invite modal */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Team Member">
        <div className="space-y-4">
          <Input label="Email address" type="email" placeholder="colleague@company.com" />
          <Select
            label="Role"
            options={[{ value: 'member', label: 'Member' }, { value: 'admin', label: 'Admin' }, { value: 'viewer', label: 'Viewer' }]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={() => setInviteOpen(false)}>Send Invite</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
