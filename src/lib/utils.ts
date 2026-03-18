import { Platform } from '@/types';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
}

export function formatNumber(value: number): string {
  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
  if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
  return value.toString();
}

export function formatPercent(value: number): string {
  return value.toFixed(2) + '%';
}

export function getPlatformColor(platform: Platform): string {
  const colors: Record<Platform, string> = {
    facebook: '#1877f2',
    tiktok: '#ff0050',
    google: '#4285f4',
    snapchat: '#fffc00',
  };
  return colors[platform];
}

export function getPlatformBgClass(platform: Platform): string {
  const classes: Record<Platform, string> = {
    facebook: 'bg-[#1877f2]/10 text-[#1877f2]',
    tiktok: 'bg-[#ff0050]/10 text-[#ff0050]',
    google: 'bg-[#4285f4]/10 text-[#4285f4]',
    snapchat: 'bg-[#fffc00]/10 text-[#fffc00]',
  };
  return classes[platform];
}

export function getPlatformName(platform: Platform): string {
  const names: Record<Platform, string> = {
    facebook: 'Facebook Ads',
    tiktok: 'TikTok Ads',
    google: 'Google Ads',
    snapchat: 'Snapchat Ads',
  };
  return names[platform];
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'paused': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'completed': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'draft': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
