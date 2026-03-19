'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Search, Bell, ChevronDown, User, CreditCard, Users, LogOut, Shield } from 'lucide-react';

export default function TopBar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-[var(--color-border)] px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search campaigns, reports..."
            className="w-full pl-9 pr-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
          />
          {searchOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl p-2">
              <p className="text-xs text-[var(--color-text-muted)] px-3 py-2">Type to search...</p>
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
              className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors relative cursor-pointer"
            >
              <Bell size={18} className="text-[var(--color-text-secondary)]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-primary)] rounded-full" />
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-1 w-80 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl">
                <div className="p-4 border-b border-[var(--color-border)]">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                </div>
                <div className="p-3 space-y-2">
                  {['AI detected ROAS drop in "Summer Sale"', 'Mike joined your team', 'Monthly report is ready'].map((msg, i) => (
                    <div key={i} className="p-2.5 rounded-lg hover:bg-[var(--color-surface-hover)] text-sm text-[var(--color-text-secondary)] cursor-pointer">{msg}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold">SC</div>
              <ChevronDown size={14} className="text-[var(--color-text-muted)]" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl py-1">
                <div className="px-4 py-3 border-b border-[var(--color-border)]">
                  <p className="font-medium text-sm">Sarah Chen</p>
                  <p className="text-xs text-[var(--color-text-muted)]">sarah@company.com</p>
                </div>
                <Link href="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"><User size={16} /> Account</Link>
                <Link href="/billing" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"><CreditCard size={16} /> Billing</Link>
                <Link href="/team" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"><Users size={16} /> Team</Link>
                <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"><Shield size={16} /> Admin</Link>
                <div className="border-t border-[var(--color-border)] mt-1 pt-1">
                  <button className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-[var(--color-surface-hover)] w-full cursor-pointer"><LogOut size={16} /> Log out</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
