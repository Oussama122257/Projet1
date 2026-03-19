'use client';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Users, Clock, Layers } from 'lucide-react';
import KPICard from '@/components/ui/KPICard';
import Select from '@/components/ui/Select';
import Tabs from '@/components/ui/Tabs';
import PerformanceChart from '@/components/charts/PerformanceChart';
import { campaigns } from '@/data/mock';
import { formatCurrency } from '@/lib/utils';

const platformData = [
  { name: 'Google', spend: 10300, conversions: 757, roas: 3.9, color: '#4285f4' },
  { name: 'Meta', spend: 9195, conversions: 1208, roas: 5.7, color: '#1877f2' },
  { name: 'TikTok', spend: 3980, conversions: 1010, roas: 3.5, color: '#ff0050' },
  { name: 'Snapchat', spend: 6390, conversions: 679, roas: 3.2, color: '#FFFC00' },
];

const audienceData = [
  { age: '18-24', conversions: 420, spend: 3200 },
  { age: '25-34', conversions: 890, spend: 5800 },
  { age: '35-44', conversions: 650, spend: 4200 },
  { age: '45-54', conversions: 380, spend: 3100 },
  { age: '55+', conversions: 210, spend: 2500 },
];

const hourlyData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i.toString().padStart(2, '0')}:00`,
  conversions: Math.round(Math.sin((i - 6) / 24 * Math.PI * 2) * 30 + 40 + Math.random() * 15),
  spend: Math.round(Math.sin((i - 6) / 24 * Math.PI * 2) * 150 + 200 + Math.random() * 50),
}));

export default function AnalyticsPage() {
  const [tab, setTab] = useState('Overview');
  const [dateRange, setDateRange] = useState('30d');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <Select
          options={[{ value: '7d', label: 'Last 7 days' }, { value: '30d', label: 'Last 30 days' }, { value: '90d', label: 'Last 90 days' }]}
          value={dateRange}
          onChange={e => setDateRange(e.target.value)}
        />
      </div>

      <Tabs tabs={['Overview', 'Audience', 'Dayparting', 'Platform Comparison']} active={tab} onChange={setTab} />

      {tab === 'Overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Total ROAS" value="4.2x" change={8.3} icon={<TrendingUp size={18} />} />
            <KPICard label="Avg. CPA" value="$12.40" change={-5.2} icon={<Users size={18} />} />
            <KPICard label="Best Hour" value="10:00 AM" change={0} icon={<Clock size={18} />} />
            <KPICard label="Active Campaigns" value="7" change={16.7} icon={<Layers size={18} />} />
          </div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
            <h2 className="text-lg font-semibold mb-4">Performance Trend</h2>
            <PerformanceChart />
          </div>
        </div>
      )}

      {tab === 'Audience' && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">Conversions by Age Group</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={audienceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e4a" />
              <XAxis dataKey="age" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#12122a', border: '1px solid #1e1e4a', borderRadius: '8px', color: '#f1f5f9' }} />
              <Bar dataKey="conversions" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 'Dayparting' && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">Conversions by Hour</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e4a" />
              <XAxis dataKey="hour" stroke="#64748b" fontSize={10} interval={2} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#12122a', border: '1px solid #1e1e4a', borderRadius: '8px', color: '#f1f5f9' }} />
              <Bar dataKey="conversions" fill="#22d3ee" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 'Platform Comparison' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
            <h2 className="text-lg font-semibold mb-4">Spend by Platform</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={platformData} dataKey="spend" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}>
                  {platformData.map((p, i) => <Cell key={i} fill={p.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#12122a', border: '1px solid #1e1e4a', borderRadius: '8px', color: '#f1f5f9' }} formatter={(v) => formatCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
            <h2 className="text-lg font-semibold mb-4">ROAS by Platform</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e4a" />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#12122a', border: '1px solid #1e1e4a', borderRadius: '8px', color: '#f1f5f9' }} />
                <Bar dataKey="roas" radius={[0, 4, 4, 0]}>
                  {platformData.map((p, i) => <Cell key={i} fill={p.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
