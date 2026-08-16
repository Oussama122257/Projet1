import Link from "next/link";
import { Logo } from "@/components/logo";
import { Avatar } from "@/components/ui/avatar";
import { NavLink, type IconName } from "./nav-link";
import { SignOutButton } from "./sign-out-button";
import type { SessionUser } from "@/lib/session";

export type NavItem = {
  href: string;
  label: string;
  /** Icon name resolved client-side — components can't cross the RSC boundary. */
  icon: IconName;
  /** Live count shown as a pill — used for the fraud queue and pending applicants. */
  badge?: number;
};

const ROLE_LABEL = {
  BRAND: "Brand workspace",
  INFLUENCER: "Creator workspace",
  ADMIN: "Administration",
} as const;

/**
 * Shared chrome for all three authenticated experiences.
 *
 * The shell is identical everywhere so navigation muscle memory transfers, but
 * the nav contents and accent labelling make it obvious which workspace you're
 * in — the three dashboards are deliberately not the same product.
 */
export function AppShell({
  user,
  nav,
  children,
}: {
  user: SessionUser;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* ------------------------------------------------------------ sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-surface-raised lg:flex">
        <div className="flex h-14 items-center border-b border-border px-5">
          <Link href="/" className="rounded-sm">
            <Logo />
          </Link>
        </div>

        <div className="px-5 py-4">
          <p className="eyebrow">{ROLE_LABEL[user.role]}</p>
        </div>

        <nav className="flex-1 space-y-0.5 px-3">
          {nav.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            <Avatar name={user.name ?? user.email} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.8125rem] font-medium text-ink">
                {user.name ?? "Account"}
              </p>
              <p className="truncate text-xs text-ink-tertiary">{user.email}</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* ------------------------------------------------------ mobile header */}
      <div className="fixed inset-x-0 top-0 z-30 border-b border-border bg-surface/90 backdrop-blur-xl lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="rounded-sm">
            <Logo />
          </Link>
          <Avatar name={user.name ?? user.email} size="sm" />
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-border px-2 py-2">
          {nav.map((item) => (
            <NavLink key={item.href} {...item} compact />
          ))}
        </nav>
      </div>

      <main className="min-w-0 flex-1 pt-28 lg:pl-60 lg:pt-0">{children}</main>
    </div>
  );
}

/** Standard page header: title, optional description, optional actions. */
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="font-display text-display-sm text-ink">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-secondary">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PageBody({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-[84rem] px-6 py-8">{children}</div>;
}
