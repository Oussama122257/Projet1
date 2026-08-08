"use client";

import { ClipboardList, Wallet } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/sidebar";

const items = [
  { href: "/dashboard/agent", label: "Mes tâches du jour", icon: ClipboardList },
  { href: "/dashboard/agent/reconciliation", label: "Caisse du jour", icon: Wallet },
];

/** Mobile-optimized PWA-style layout for delivery agents. */
export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell title="Agent Livraison" items={items}>
      {children}
    </DashboardShell>
  );
}
