"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Compass,
  LayoutDashboard,
  Link2,
  Megaphone,
  ShieldAlert,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Icons are looked up by name rather than passed as props.
 *
 * The layouts that build the nav are server components, and a React component
 * can't cross the server/client boundary as a prop — so the boundary carries a
 * string and the mapping lives here, on the client side.
 */
const ICONS = {
  dashboard: LayoutDashboard,
  campaigns: Megaphone,
  applicants: Users,
  wallet: Wallet,
  compass: Compass,
  connections: Link2,
  fraud: ShieldAlert,
  analytics: BarChart3,
  users: Users,
} as const;

export type IconName = keyof typeof ICONS;

export function NavLink({
  href,
  label,
  icon,
  badge,
  compact,
}: {
  href: string;
  label: string;
  icon: IconName;
  badge?: number;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const Icon = ICONS[icon];

  // Section roots match exactly so /brand doesn't stay lit on /brand/campaigns.
  const isRoot = ["/brand", "/influencer", "/admin"].includes(href);
  const active =
    pathname === href || (!isRoot && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-md text-sm transition-colors",
        compact ? "shrink-0 px-3 py-1.5" : "px-3 py-2",
        active
          ? "bg-accent-muted/60 text-ink"
          : "text-ink-secondary hover:bg-surface-overlay hover:text-ink"
      )}
    >
      {active && !compact && (
        <span
          className="absolute inset-y-1.5 -left-3 w-0.5 rounded-full bg-accent"
          aria-hidden
        />
      )}
      <Icon
        className={cn("size-4 shrink-0", active ? "text-accent" : "text-ink-tertiary")}
        aria-hidden
      />
      <span className="truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="tabular ml-auto rounded-full bg-danger/15 px-1.5 text-[0.6875rem] font-medium leading-5 text-danger">
          {badge}
        </span>
      )}
    </Link>
  );
}
