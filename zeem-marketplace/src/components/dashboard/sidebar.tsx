"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, X, type LucideIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Responsive dashboard shell: navy sidebar (desktop) / drawer (mobile). */
export function DashboardShell({
  title,
  items,
  children,
}: {
  title: string;
  items: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active =
          item.href === pathname ||
          (pathname.startsWith(item.href + "/") && item.href.split("/").length > 3);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-gold text-navy-800" : "text-navy-100 hover:bg-white/10"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-navy-200 hover:bg-white/10"
      >
        <LogOut className="h-5 w-5" /> Déconnexion
      </button>
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-navy-700 p-4 lg:flex">
        <Link href="/" className="mb-8 px-3 text-2xl font-black text-white">
          ZEEM<span className="text-gold">.dz</span>
        </Link>
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-navy-200">{title}</p>
        {nav}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-900/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-navy-700 p-4">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-xl font-black text-white">
                ZEEM<span className="text-gold">.dz</span>
              </span>
              <button onClick={() => setOpen(false)} className="text-white"><X /></button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b bg-white/80 px-4 py-3 backdrop-blur-md lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Menu"><Menu className="h-6 w-6 text-navy-700" /></button>
          <span className="font-bold text-navy-700">{title}</span>
        </header>
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
