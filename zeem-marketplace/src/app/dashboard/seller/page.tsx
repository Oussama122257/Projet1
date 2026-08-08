import { redirect } from "next/navigation";
import { DollarSign, Package, ShoppingCart, TrendingUp } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatDZD } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import { WilayaHeatmap, RevenueChart } from "@/components/dashboard/charts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

/** Seller home: revenue widgets, wilaya sales heatmap, 7-day revenue line. */
export default async function SellerDashboard() {
  const session = await auth();
  const store = await db.store.findUnique({ where: { userId: session!.user.id } });
  if (!store) redirect("/register");

  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(dayStart.getTime() - 6 * 86400_000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [delivered, orderItems, productCount, viewsAgg] = await Promise.all([
    // Delivered shipments = real (collected) revenue
    db.shipment.findMany({
      where: { sellerId: store.id, status: "DELIVERED" },
      select: { codAmount: true, shippingFee: true, deliveredAt: true },
    }),
    db.orderItem.findMany({
      where: { sellerId: store.id },
      include: {
        order: { include: { shippingAddress: { include: { wilaya: true } } } },
      },
    }),
    db.product.count({ where: { storeId: store.id } }),
    db.product.aggregate({ where: { storeId: store.id }, _sum: { views: true } }),
  ]);

  const revenueOf = (from: Date) =>
    delivered
      .filter((s) => s.deliveredAt && s.deliveredAt >= from)
      .reduce((sum, s) => sum + (s.codAmount - s.shippingFee), 0);

  const totalOrders = new Set(orderItems.map((i) => i.orderId)).size;
  const views = viewsAgg._sum.views ?? 0;
  const conversion = views > 0 ? ((totalOrders / views) * 100).toFixed(1) : "0";

  // Wilaya heatmap data
  const byWilaya = new Map<string, number>();
  for (const item of orderItems) {
    const w = item.order.shippingAddress?.wilaya.name;
    if (w) byWilaya.set(w, (byWilaya.get(w) ?? 0) + 1);
  }

  // 7-day revenue series
  const days: Array<{ day: string; revenue: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(dayStart.getTime() - i * 86400_000);
    const next = new Date(d.getTime() + 86400_000);
    days.push({
      day: d.toLocaleDateString("fr-DZ", { weekday: "short" }),
      revenue: delivered
        .filter((s) => s.deliveredAt && s.deliveredAt >= d && s.deliveredAt < next)
        .reduce((sum, s) => sum + (s.codAmount - s.shippingFee), 0),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-700">Salam, {store.name} 👋</h1>
        {!store.isActive && (
          <p className="mt-2 rounded-xl bg-amber-100 p-3 text-sm text-amber-800">
            ⏳ Votre boutique est en attente de validation par l&apos;équipe Zeem.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenu aujourd'hui" value={formatDZD(revenueOf(dayStart))} icon={DollarSign} />
        <StatCard label="Revenu 7 jours" value={formatDZD(revenueOf(weekStart))} icon={TrendingUp} accent="navy" />
        <StatCard label="Revenu du mois" value={formatDZD(revenueOf(monthStart))} icon={DollarSign} accent="emerald" />
        <StatCard label="Commandes" value={String(totalOrders)} sub={`Conversion: ${conversion}% · ${productCount} produits`} icon={ShoppingCart} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>📈 Revenu — 7 derniers jours</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={days} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>🗺️ Ventes par wilaya</CardTitle>
          </CardHeader>
          <CardContent>
            {byWilaya.size === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Vos ventes par région apparaîtront ici.
              </p>
            ) : (
              <WilayaHeatmap
                data={[...byWilaya.entries()].map(([wilaya, orders]) => ({ wilaya, orders }))}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="glass flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">Solde disponible (COD encaissé)</p>
          <p className="text-2xl font-black text-emerald2">{formatDZD(store.balance)}</p>
        </div>
        <Package className="h-10 w-10 text-gold" />
      </div>
    </div>
  );
}
