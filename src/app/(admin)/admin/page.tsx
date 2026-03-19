'use client';
import { Users, Building2, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import KPICard from '@/components/ui/KPICard';

const mrrData = Array.from({ length: 12 }, (_, i) => ({
  month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
  mrr: Math.round(2000 + i * 800 + Math.random() * 500),
  users: Math.round(50 + i * 25 + Math.random() * 15),
}));

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Admin Overview</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Users" value="156" change={12.5} icon={<Users size={18} />} />
        <KPICard label="Organizations" value="42" change={8.3} icon={<Building2 size={18} />} />
        <KPICard label="MRR" value="$12,450" change={15.2} icon={<DollarSign size={18} />} />
        <KPICard label="Trial Conversion" value="34%" change={5.1} icon={<TrendingUp size={18} />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">MRR Growth</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mrrData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e4a" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#12122a', border: '1px solid #1e1e4a', borderRadius: '8px', color: '#f1f5f9' }} />
              <Line type="monotone" dataKey="mrr" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">User Growth</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mrrData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e4a" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#12122a', border: '1px solid #1e1e4a', borderRadius: '8px', color: '#f1f5f9' }} />
              <Line type="monotone" dataKey="users" stroke="#22d3ee" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">Quick Stats</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-4 bg-[var(--color-background)] rounded-lg border border-[var(--color-border)]">
            <p className="text-sm text-[var(--color-text-muted)] mb-1">Active Ad Accounts</p>
            <p className="text-2xl font-bold">33</p>
          </div>
          <div className="p-4 bg-[var(--color-background)] rounded-lg border border-[var(--color-border)]">
            <p className="text-sm text-[var(--color-text-muted)] mb-1">Active Subscriptions</p>
            <p className="text-2xl font-bold">38</p>
          </div>
          <div className="p-4 bg-[var(--color-background)] rounded-lg border border-[var(--color-border)]">
            <p className="text-sm text-[var(--color-text-muted)] mb-1">Failed Payments</p>
            <p className="text-2xl font-bold text-red-400">3</p>
          </div>
        </div>
      </div>
    </div>
  );
}
