"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Beaker,
  Bot,
  Calendar,
  FileText,
  Film,
  LayoutDashboard,
  ListChecks,
  LogOut,
  PlugZap,
  Radio,
  Settings,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pipelines", label: "Pipelines", icon: Workflow },
  { href: "/sources", label: "Sources", icon: Radio },
  { href: "/content", label: "Content", icon: Film },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/experiments", label: "Experiments", icon: Beaker },
  { href: "/ai", label: "AI Studio", icon: Bot },
  { href: "/integrations", label: "Integrations", icon: PlugZap },
  { href: "/jobs", label: "Jobs", icon: ListChecks },
  { href: "/logs", label: "Logs", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-surface-border bg-surface-raised">
      <div className="flex h-14 items-center gap-2 px-5">
        <span className="flex h-6 w-6 items-center justify-center rounded bg-accent text-xs font-bold text-white">
          C
        </span>
        <span className="text-sm font-semibold tracking-tight">ContentLoop</span>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2" aria-label="Main">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded px-2.5 py-2 text-[13px] transition-colors",
                active
                  ? "bg-accent/15 font-medium text-accent-hover"
                  : "text-content-secondary hover:bg-surface-overlay hover:text-content-primary",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-surface-border p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-[13px] text-content-secondary transition-colors hover:bg-surface-overlay hover:text-content-primary"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </button>
      </div>
    </aside>
  );
}
