import { db } from "@/lib/db";
import { formatDZD } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { CouponForm } from "./coupon-form";

export const dynamic = "force-dynamic";

/** Marketing Hub: coupons, flash sales, ROAS from UTM-attributed orders. */
export default async function AdminMarketingPage() {
  const [coupons, flashSales, campaignOrders] = await Promise.all([
    db.coupon.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    db.flashSale.findMany({ orderBy: { startsAt: "desc" }, take: 10 }),
    db.order.groupBy({
      by: ["utmCampaign"],
      where: { utmSource: { not: null } },
      _sum: { totalAmount: true },
      _count: true,
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-700">Marketing Hub</h1>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>🎟️ Coupons</CardTitle>
            <CardDescription>Réduction pourcentage ou montant fixe.</CardDescription>
          </CardHeader>
          <CardContent>
            <CouponForm />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Réduction</TableHead>
                  <TableHead>Utilisations</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-bold">{c.code}</TableCell>
                    <TableCell>{c.type === "PERCENT" ? `${c.value}%` : formatDZD(c.value)}</TableCell>
                    <TableCell>{c.usedCount}/{c.maxUses}</TableCell>
                    <TableCell>
                      <Badge variant={c.isActive ? "success" : "outline"}>
                        {c.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>⚡ Ventes Flash</CardTitle>
            </CardHeader>
            <CardContent>
              {flashSales.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune vente flash programmée.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {flashSales.map((f) => (
                    <li key={f.id} className="flex justify-between rounded-xl bg-muted p-3">
                      <span className="font-semibold">{f.title} (−{f.discountPercent}%)</span>
                      <span className="text-muted-foreground">
                        {f.startsAt.toLocaleDateString("fr-DZ")} → {f.endsAt.toLocaleDateString("fr-DZ")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📊 ROAS Meta Ads (par campagne UTM)</CardTitle>
              <CardDescription>
                Revenu attribué aux commandes arrivées avec utm_source. Croisez avec
                vos dépenses Meta pour le ROAS exact.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {campaignOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune commande attribuée à une campagne.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {campaignOrders.map((c) => (
                    <li key={c.utmCampaign ?? "direct"} className="flex justify-between rounded-xl bg-muted p-3">
                      <span className="font-semibold">{c.utmCampaign ?? "(sans campagne)"}</span>
                      <span>
                        {c._count} cmd · <strong className="text-gold-600">{formatDZD(c._sum.totalAmount ?? 0)}</strong>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
