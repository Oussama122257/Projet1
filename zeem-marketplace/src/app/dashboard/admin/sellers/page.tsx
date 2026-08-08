import { db } from "@/lib/db";
import { formatDZD } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { SellerActions } from "./seller-actions";

export const dynamic = "force-dynamic";

/** Seller verification: approve/reject store applications. */
export default async function AdminSellersPage() {
  const stores = await db.store.findMany({
    include: { user: true, wilaya: true, _count: { select: { products: true } } },
    orderBy: [{ isActive: "asc" }],
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-navy-700">Vendeurs</h1>
      <div className="glass p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Boutique</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Wilaya</TableHead>
              <TableHead>Produits</TableHead>
              <TableHead>Solde</TableHead>
              <TableHead>Licence</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stores.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-semibold text-navy-700">{s.name}</TableCell>
                <TableCell className="text-xs">
                  {s.user.name}
                  <br />
                  {s.user.phone}
                </TableCell>
                <TableCell>{s.wilaya.name}</TableCell>
                <TableCell>{s._count.products}</TableCell>
                <TableCell>{formatDZD(s.balance)}</TableCell>
                <TableCell>
                  {s.licenceUrl ? (
                    <a href={s.licenceUrl} target="_blank" className="text-sm font-semibold text-gold-600 underline">
                      Voir 📄
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">Non fournie</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={s.isActive ? "success" : "warning"}>
                    {s.isActive ? "Active" : "En attente"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <SellerActions storeId={s.id} isActive={s.isActive} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
