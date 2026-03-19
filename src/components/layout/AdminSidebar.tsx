'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Building2, CreditCard, Activity, Brain, LifeBuoy, ArrowLeft, Zap } from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/tenants', label: 'Tenants', icon: Building2 },
  { href: '/admin/billing', label: 'Billing', icon: CreditCard },
  { href: '/admin/health', label: 'Platform Health', icon: Activity },
  { href: '/admin/ai-monitoring', label: 'AI Monitoring', icon: Brain },
  { href: '/admin/support', label: 'Support Tickets', icon: LifeBuoy },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-[240px] bg-[var(--color-surface)] border-r border-[var(--color-border)] z-40">
      <div className="flex items-center gap-2 p-4 border-b border-[var(--color-border)]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
          <Zap size={18} className="text-white" />
        </div>
        <span className="text-lg font-bold text-red-400">Admin Panel</span>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active ? 'bg-red-500/10 text-red-400' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]'
              )}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[var(--color-border)]">
        <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
          <ArrowLeft size={16} /> Back to App
        </Link>
      </div>
    </aside>
  );
}
