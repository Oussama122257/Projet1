import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleString();
}

export function formatRelative(ts: number) {
  const diff = Date.now() / 1000 - ts;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    success: 'badge-success',
    pending: 'badge-pending',
    failed: 'badge-failed',
    fail: 'badge-failed',
    generating: 'badge-generating',
    waiting: 'badge-pending',
    queuing: 'badge-pending',
  };
  return map[status] || 'badge-pending';
}
