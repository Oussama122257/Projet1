'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  label: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  prefix?: string;
}

export default function KPICard({ label, value, change, icon, prefix }: KPICardProps) {
  const isPositive = change > 0;
  const isNeutral = change === 0;

  return (
    <div className="bg-surface rounded-xl border border-border p-5 hover:border-primary/30 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
          {icon}
        </div>
        <div className={cn(
          'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
          isNeutral ? 'bg-gray-500/10 text-gray-400' :
          isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
        )}>
          {isNeutral ? <Minus className="w-3 h-3" /> :
           isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(change)}%
        </div>
      </div>
      <p className="text-2xl font-bold text-text-primary">{prefix}{value}</p>
      <p className="text-sm text-text-muted mt-1">{label}</p>
    </div>
  );
}
