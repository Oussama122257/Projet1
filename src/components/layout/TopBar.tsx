'use client';

import { Bell, Search, User } from 'lucide-react';
import { useState } from 'react';

export default function TopBar() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {searchOpen ? (
          <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 w-80 border border-border">
            <Search className="w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search campaigns, metrics..."
              className="bg-transparent text-sm text-text-primary outline-none w-full placeholder:text-text-muted"
              autoFocus
              onBlur={() => setSearchOpen(false)}
            />
          </div>
        ) : (
          <button onClick={() => setSearchOpen(true)} className="flex items-center gap-2 text-text-muted hover:text-text-secondary transition-colors text-sm">
            <Search className="w-4 h-4" />
            <span>Search...</span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-background rounded border border-border">⌘K</kbd>
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-surface-hover transition-colors text-text-secondary hover:text-text-primary">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger rounded-full border-2 border-surface" />
        </button>

        <div className="flex items-center gap-3 pl-3 border-l border-border">
          <div className="text-right">
            <p className="text-sm font-medium text-text-primary">John Doe</p>
            <p className="text-xs text-text-muted">Pro Plan</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>
    </header>
  );
}
