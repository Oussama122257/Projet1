export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function platformColor(platform: string): string {
  const colors: Record<string, string> = {
    google: 'bg-blue-500/20 text-blue-400',
    meta: 'bg-indigo-500/20 text-indigo-400',
    tiktok: 'bg-pink-500/20 text-pink-400',
    snapchat: 'bg-yellow-500/20 text-yellow-400',
  };
  return colors[platform] || 'bg-gray-500/20 text-gray-400';
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-emerald-500/20 text-emerald-400',
    paused: 'bg-amber-500/20 text-amber-400',
    deleted: 'bg-red-500/20 text-red-400',
    draft: 'bg-gray-500/20 text-gray-400',
    connected: 'bg-emerald-500/20 text-emerald-400',
    expired: 'bg-red-500/20 text-red-400',
    disconnected: 'bg-gray-500/20 text-gray-400',
    pending: 'bg-amber-500/20 text-amber-400',
    trialing: 'bg-cyan-500/20 text-cyan-400',
    past_due: 'bg-red-500/20 text-red-400',
    suspended: 'bg-red-500/20 text-red-400',
    paid: 'bg-emerald-500/20 text-emerald-400',
    failed: 'bg-red-500/20 text-red-400',
    open: 'bg-blue-500/20 text-blue-400',
    in_progress: 'bg-amber-500/20 text-amber-400',
    resolved: 'bg-emerald-500/20 text-emerald-400',
  };
  return colors[status] || 'bg-gray-500/20 text-gray-400';
}
