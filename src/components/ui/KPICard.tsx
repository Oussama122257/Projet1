'use client';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  label: string;
  value: string;
  change: number;
  icon?: React.ReactNode;
}

export default function KPICard({ label, value, change, icon }: KPICardProps) {
  const isPositive = change >= 0;
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 hover:border-[var(--color-primary)]/30 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
        {icon && <span className="text-[var(--color-text-muted)]">{icon}</span>}
      </div>
      <div className="text-2xl font-bold mb-2">{value}</div>
      <div className={cn('flex items-center gap-1 text-sm', isPositive ? 'text-emerald-400' : 'text-red-400')}>
        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        <span>{isPositive ? '+' : ''}{change.toFixed(1)}%</span>
        <span className="text-[var(--color-text-muted)] ml-1">vs yesterday</span>
      </div>
    </div>
  );
}
