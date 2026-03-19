'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Megaphone, BarChart3, MessageSquare, FileText,
  Users, Settings, CreditCard, ChevronLeft, ChevronRight, Sparkles, Zap
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/chat', label: 'AI Chat', icon: MessageSquare },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/billing', label: 'Billing', icon: CreditCard },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex justify-around py-2">
        {navItems.slice(0, 5).map(item => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn('flex flex-col items-center gap-0.5 p-1', active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]')}>
              <Icon size={20} />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden md:flex flex-col fixed top-0 left-0 h-screen bg-[var(--color-surface)] border-r border-[var(--color-border)] z-40 transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}>
        <div className={cn('flex items-center gap-2 p-4 border-b border-[var(--color-border)]', collapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          {!collapsed && <span className="text-lg font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">AdPilot</span>}
        </div>

        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  active ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]',
                  collapsed && 'justify-center px-2'
                )}
              >
                <Icon size={20} />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.label === 'AI Chat' && (
                  <Sparkles size={14} className="ml-auto text-[var(--color-accent)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className={cn('p-3 border-t border-[var(--color-border)]', collapsed && 'flex justify-center')}>
          {!collapsed && (
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold">SC</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Sarah Chen</p>
                <p className="text-xs text-[var(--color-text-muted)] truncate">Pro Plan</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>
    </>
  );
}
