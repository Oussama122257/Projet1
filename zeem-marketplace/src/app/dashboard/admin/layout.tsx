"use client";

import { Activity, LayoutDashboard, Megaphone, Store, Truck } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/sidebar";

const items = [
  { href: "/dashboard/admin", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/dashboard/admin/sellers", label: "Vendeurs", icon: Store },
  { href: "/dashboard/admin/deliveries", label: "Livraisons", icon: Truck },
  { href: "/dashboard/admin/marketing", label: "Marketing Hub", icon: Megaphone },
  { href: "/dashboard/admin/pixels", label: "Pixel Manager", icon: Activity },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell title="Administration" items={items}>
      {children}
    </DashboardShell>
  );
}
