import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatDZD } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export const dynamic = "force-dynamic";

/** Seller payments: balance + COMMISSION / PAYOUT transaction history. */
export default async function SellerPaymentsPage() {
  const session = await auth();
  const store = await db.store.findUnique({ where: { userId: session!.user.id } });
  if (!store) redirect("/register");

  const transactions = await db.transaction.findMany({
    where: { sellerId: store.id },
    include: { order: { select: { reference: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const TYPE_FR = { COMMISSION: "Commission Zeem", PAYOUT: "Versement vente", REFUND: "Remboursement" };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-700">Paiements</h1>

      <div className="glass flex items-center gap-4 p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald2-light">
          <Wallet className="h-7 w-7 text-emerald2" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Solde disponible</p>
          <p className="text-3xl font-black text-navy-700">{formatDZD(store.balance)}</p>
          <p className="text-xs text-muted-foreground">
            Versements hebdomadaires (CCP / virement) — commission Zeem: {store.commissionRate}%
          </p>
        </div>
      </div>

      <div className="glass p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Commande</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Vos mouvements apparaîtront après votre première vente encaissée.
                </TableCell>
              </TableRow>
            )}
            {transactions.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.createdAt.toLocaleDateString("fr-DZ")}</TableCell>
                <TableCell>{TYPE_FR[t.type]}</TableCell>
                <TableCell className="font-mono text-xs">{t.order?.reference ?? "—"}</TableCell>
                <TableCell className={t.type === "PAYOUT" ? "font-bold text-emerald2" : "text-red-600"}>
                  {t.type === "PAYOUT" ? "+" : "−"}{formatDZD(t.amount)}
                </TableCell>
                <TableCell>
                  <Badge variant={t.status === "PAID" ? "success" : t.status === "FAILED" ? "destructive" : "warning"}>
                    {t.status === "PAID" ? "Payé" : t.status === "FAILED" ? "Échoué" : "En attente"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
