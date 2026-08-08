import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatDZD } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function SellerProductsPage() {
  const session = await auth();
  const store = await db.store.findUnique({ where: { userId: session!.user.id } });
  if (!store) redirect("/register");

  const products = await db.product.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-700">Produits ({products.length})</h1>
        <Button asChild variant="gold">
          <Link href="/dashboard/seller/products/new">
            <Plus className="h-4 w-4" /> Nouveau produit
          </Link>
        </Button>
      </div>

      <div className="glass p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Vendus</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Ajoutez votre premier produit — l&apos;IA écrira la description pour vous ✨
                </TableCell>
              </TableRow>
            )}
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="max-w-[240px]">
                  <span className="font-semibold text-navy-700">{p.name}</span>
                  {p.aiGeneratedDesc && <span className="ml-1 text-xs">✨</span>}
                </TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell className="font-semibold">{formatDZD(p.price)}</TableCell>
                <TableCell className={p.stock <= 5 ? "font-bold text-red-600" : ""}>{p.stock}</TableCell>
                <TableCell>{p.soldCount}</TableCell>
                <TableCell>
                  <Badge variant={p.status === "PUBLISHED" ? "success" : p.status === "DRAFT" ? "warning" : "outline"}>
                    {p.status === "PUBLISHED" ? "Publié" : p.status === "DRAFT" ? "Brouillon" : "Archivé"}
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
