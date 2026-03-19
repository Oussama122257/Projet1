'use client';
import { cn } from '@/lib/utils';

interface TabsProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}

export default function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 bg-[var(--color-background)] p-1 rounded-lg border border-[var(--color-border)]">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer',
            active === tab
              ? 'bg-[var(--color-primary)] text-white'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
