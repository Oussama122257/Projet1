'use client';
import { useState } from 'react';
import { FileText, Plus, Calendar, Download, Trash2, Edit2, Clock, BarChart3, Users, Layers } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Tabs from '@/components/ui/Tabs';
import { reports } from '@/data/mock';

const typeIcons: Record<string, React.ReactNode> = {
  performance: <BarChart3 size={16} className="text-[var(--color-primary)]" />,
  creative: <Layers size={16} className="text-purple-400" />,
  audience: <Users size={16} className="text-emerald-400" />,
  dayparting: <Clock size={16} className="text-amber-400" />,
};

export default function ReportsPage() {
  const [tab, setTab] = useState('Pre-built Reports');
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Reports</h1>
        <Button onClick={() => setCreateOpen(true)}><Plus size={16} /> Create Report</Button>
      </div>

      <Tabs tabs={['Pre-built Reports', 'Scheduled Reports', 'Custom Builder']} active={tab} onChange={setTab} />

      {tab === 'Pre-built Reports' && (
        <div className="grid sm:grid-cols-2 gap-4">
          {reports.map(r => (
            <div key={r.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 hover:border-[var(--color-primary)]/30 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-background)] flex items-center justify-center">
                    {typeIcons[r.type]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{r.name}</h3>
                    <p className="text-xs text-[var(--color-text-muted)] capitalize">{r.type} report</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-text-muted)]">Created {r.createdAt}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline"><Download size={14} /> Export</Button>
                  <Button size="sm" variant="ghost"><FileText size={14} /> View</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Scheduled Reports' && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                {['Report', 'Frequency', 'Last Sent', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[var(--color-text-muted)] uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.filter(r => r.schedule).map(r => (
                <tr key={r.id} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-hover)]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {typeIcons[r.type]}
                      <span className="text-sm font-medium">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge className="bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                      <Calendar size={12} className="mr-1" /> {r.schedule}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-sm text-[var(--color-text-muted)]">{r.createdAt}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost"><Edit2 size={14} /></Button>
                      <Button size="sm" variant="ghost" className="text-red-400"><Trash2 size={14} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Custom Builder' && (
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-3">Available Metrics</h3>
            <div className="space-y-2">
              {['Spend', 'Impressions', 'Clicks', 'Conversions', 'ROAS', 'CPA', 'CTR', 'Frequency', 'CPM'].map(m => (
                <div key={m} className="px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm cursor-grab hover:border-[var(--color-primary)]/30 transition-colors">{m}</div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Report Canvas</h3>
              <div className="flex gap-2">
                <Select options={[{ value: '7d', label: 'Last 7 days' }, { value: '30d', label: 'Last 30 days' }]} />
                <Select options={[{ value: 'all', label: 'All Platforms' }, { value: 'google', label: 'Google' }, { value: 'meta', label: 'Meta' }]} />
              </div>
            </div>
            <div className="border-2 border-dashed border-[var(--color-border)] rounded-xl h-80 flex items-center justify-center">
              <div className="text-center">
                <Layers size={40} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
                <p className="text-[var(--color-text-muted)]">Drag metrics here to build your report</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline">Save Report</Button>
              <Button><Download size={14} /> Export PDF</Button>
            </div>
          </div>
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Report">
        <div className="space-y-4">
          <Input label="Report Name" placeholder="e.g. Weekly Performance Summary" />
          <Select
            label="Report Type"
            options={[{ value: 'performance', label: 'Performance' }, { value: 'creative', label: 'Creative' }, { value: 'audience', label: 'Audience' }, { value: 'dayparting', label: 'Dayparting' }]}
          />
          <Select
            label="Schedule (optional)"
            options={[{ value: '', label: 'No schedule' }, { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => setCreateOpen(false)}>Create Report</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
