import { redirect } from "next/navigation";
import { AppShell, type NavItem } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/session";

export default async function InfluencerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const nav: NavItem[] = [
    { href: "/influencer", label: "Earnings", icon: "dashboard" },
    { href: "/influencer/campaigns", label: "Find campaigns", icon: "compass" },
    { href: "/influencer/connections", label: "Connections", icon: "connections" },
    { href: "/influencer/payouts", label: "Payouts", icon: "wallet" },
  ];

  return (
    <AppShell user={user} nav={nav}>
      {children}
    </AppShell>
  );
}
