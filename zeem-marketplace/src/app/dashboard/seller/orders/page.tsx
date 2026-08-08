import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatDZD } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ConfirmShipmentButton } from "./confirm-button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "Toutes" },
  { key: "PENDING_PICKUP", label: "À expédier" },
  { key: "IN_TRANSIT", label: "En transit" },
  { key: "OUT_FOR_DELIVERY", label: "En livraison" },
  { key: "DELIVERED", label: "Encaissées ✅" },
  { key: "RETURNED", label: "Retours" },
] as const;

/** Seller order management — per-shipment view with COD collection status. */
export default async function SellerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const session = await auth();
  const store = await db.store.findUnique({ where: { userId: session!.user.id } });
  if (!store) redirect("/register");

  const shipments = await db.shipment.findMany({
    where: {
      sellerId: store.id,
      ...(status && status !== "all" ? { status: status as never } : {}),
    },
    include: {
      order: {
        include: {
          items: { include: { product: true } },
          shippingAddress: { include: { wilaya: true } },
        },
      },
    },
    orderBy: { id: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-navy-700">Commandes</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/dashboard/seller/orders${f.key === "all" ? "" : `?status=${f.key}`}`}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium",
              (status ?? "all") === f.key ? "border-gold bg-gold text-navy-800" : "bg-white hover:border-gold"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="glass p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Réf</TableHead>
              <TableHead>Articles</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>COD</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Aucune commande dans ce filtre.
                </TableCell>
              </TableRow>
            )}
            {shipments.map((s) => {
              const myItems = s.order.items.filter((i) => i.sellerId === store.id);
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs font-bold">{s.order.reference}</TableCell>
                  <TableCell className="max-w-[220px] truncate">
                    {myItems.map((i) => `${i.quantity}× ${i.product.name}`).join(", ")}
                  </TableCell>
                  <TableCell>{s.order.shippingAddress?.wilaya.name ?? "—"}</TableCell>
                  <TableCell className="font-semibold">{formatDZD(s.codAmount)}</TableCell>
                  <TableCell>
                    {s.status === "DELIVERED" ? (
                      <Badge variant="success">💵 Encaissé par livreur</Badge>
                    ) : (
                      <Badge variant={s.status === "RETURNED" || s.status === "FAILED" ? "destructive" : "gold"}>
                        {s.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <ConfirmShipmentButton
                      shipmentId={s.id}
                      hasWaybill={!!s.trackingNumber}
                      waybillUrl={s.waybillUrl}
                      delivered={s.status === "DELIVERED"}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
