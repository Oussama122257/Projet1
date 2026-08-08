import { notFound } from "next/navigation";
import { PackageCheck } from "lucide-react";
import { db } from "@/lib/db";
import { formatDZD } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const STATUS_FR: Record<string, string> = {
  PENDING: "En attente de confirmation",
  CONFIRMED: "Confirmée",
  PROCESSING: "En préparation",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée ✅",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
  PENDING_PICKUP: "En attente de ramassage",
  IN_TRANSIT: "En transit",
  OUT_FOR_DELIVERY: "En cours de livraison",
  FAILED: "Échec de livraison",
  RETURNED: "Retournée",
};

/** Public order tracking — the reference acts as the access token. */
export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const order = await db.order.findUnique({
    where: { reference: reference.toUpperCase() },
    include: {
      items: { include: { product: true } },
      shipments: { include: { seller: true } },
      shippingAddress: { include: { wilaya: true, commune: true } },
    },
  });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3">
        <PackageCheck className="h-8 w-8 text-gold-600" />
        <div>
          <h1 className="text-xl font-bold text-navy-700">Commande {order.reference}</h1>
          <p className="text-sm text-muted-foreground">
            {order.createdAt.toLocaleDateString("fr-DZ")} —{" "}
            {order.shippingAddress
              ? `${order.shippingAddress.commune.name}, ${order.shippingAddress.wilaya.name}`
              : ""}
          </p>
        </div>
        <Badge variant={order.status === "DELIVERED" ? "success" : "gold"} className="ml-auto">
          {STATUS_FR[order.status] ?? order.status}
        </Badge>
      </div>

      <div className="glass mt-6 p-4">
        <h2 className="font-bold text-navy-700">Articles</h2>
        <div className="mt-3 space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.quantity}× {item.product.name}
                {item.size ? ` (${item.size})` : ""}
              </span>
              <span className="font-semibold">{formatDZD(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {order.shipments.map((s, i) => (
          <div key={s.id} className="glass p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-navy-700">
                Colis {i + 1} — {s.seller.name}
              </p>
              <Badge variant={s.status === "DELIVERED" ? "success" : "default"}>
                {STATUS_FR[s.status] ?? s.status}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Transporteur: {s.deliveryCompany}
              {s.trackingNumber ? ` · Suivi: ${s.trackingNumber}` : ""}
              {` · Livraison: ${formatDZD(s.shippingFee)}`}
            </p>
          </div>
        ))}
      </div>

      <div className="glass mt-4 flex justify-between p-4 font-black text-navy-700">
        <span>Total à payer à la livraison</span>
        <span className="text-gold-600">{formatDZD(order.totalAmount)}</span>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        💵 Paiement en espèces au livreur. Le livreur vous appellera avant de passer.
      </p>
    </div>
  );
}
