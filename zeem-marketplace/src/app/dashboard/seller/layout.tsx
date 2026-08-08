"use client";

import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/sidebar";

const items = [
  { href: "/dashboard/seller", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dashboard/seller/orders", label: "Commandes", icon: ShoppingCart },
  { href: "/dashboard/seller/products", label: "Produits", icon: Package },
  { href: "/dashboard/seller/analytics", label: "Analytique", icon: BarChart3 },
  { href: "/dashboard/seller/payments", label: "Paiements", icon: CreditCard },
  { href: "/dashboard/seller/settings", label: "Ma Boutique", icon: Settings },
];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell title="Espace Vendeur" items={items}>
      {children}
    </DashboardShell>
  );
}
