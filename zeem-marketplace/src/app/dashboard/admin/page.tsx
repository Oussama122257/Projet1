import { AlertTriangle, DollarSign, Store, TrendingUp } from "lucide-react";
import { db } from "@/lib/db";
import { formatDZD } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import { WilayaHeatmap } from "@/components/dashboard/charts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

/** Admin top bar: GMV, active sellers, disputes, platform revenue. */
export default async function AdminDashboard() {
  const [gmvAgg, activeSellers, pendingSellers, failedShipments, feeAgg, orders] =
    await Promise.all([
      db.order.aggregate({
        where: { status: { notIn: ["CANCELLED", "REFUNDED"] } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      db.store.count({ where: { isActive: true } }),
      db.store.count({ where: { isActive: false } }),
      db.shipment.count({ where: { status: { in: ["FAILED", "RETURNED"] } } }),
      db.order.aggregate({
        where: { status: "DELIVERED" },
        _sum: { platformFee: true },
      }),
      db.order.findMany({
        include: { shippingAddress: { include: { wilaya: true } } },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
    ]);

  const byWilaya = new Map<string, number>();
  for (const o of orders) {
    const w = o.shippingAddress?.wilaya.name;
    if (w) byWilaya.set(w, (byWilaya.get(w) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-700">Vue d&apos;ensemble Zeem</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="GMV total"
          value={formatDZD(gmvAgg._sum.totalAmount ?? 0)}
          sub={`${gmvAgg._count} commandes`}
          icon={TrendingUp}
        />
        <StatCard
          label="Vendeurs actifs"
          value={String(activeSellers)}
          sub={`${pendingSellers} en attente de validation`}
          icon={Store}
          accent="navy"
        />
        <StatCard
          label="Litiges / retours"
          value={String(failedShipments)}
          sub="Expéditions échouées ou retournées"
          icon={AlertTriangle}
        />
        <StatCard
          label="Revenu plateforme"
          value={formatDZD(feeAgg._sum.platformFee ?? 0)}
          sub="Commissions sur commandes livrées"
          icon={DollarSign}
          accent="emerald"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🗺️ Commandes par wilaya (500 dernières)</CardTitle>
        </CardHeader>
        <CardContent>
          {byWilaya.size === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Aucune commande pour le moment.</p>
          ) : (
            <WilayaHeatmap data={[...byWilaya.entries()].map(([wilaya, orders]) => ({ wilaya, orders }))} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
