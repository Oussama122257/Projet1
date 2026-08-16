import { redirect } from "next/navigation";
import { AppShell, type NavItem } from "@/components/layout/app-shell";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const openFlags = await prisma.fraudFlag.count({ where: { resolvedAt: null } });

  const nav: NavItem[] = [
    {
      href: "/admin",
      label: "Fraud queue",
      icon: "fraud",
      badge: openFlags,
    },
    { href: "/admin/analytics", label: "Analytics", icon: "analytics" },
    { href: "/admin/users", label: "Users", icon: "users" },
  ];

  return (
    <AppShell user={user} nav={nav}>
      {children}
    </AppShell>
  );
}
