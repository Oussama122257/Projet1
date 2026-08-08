import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ShipmentCard } from "./shipment-card";

export const dynamic = "force-dynamic";

/**
 * Agent daily tasks, split "Ramassages" (pickups at seller stores) and
 * "Livraisons" (deliveries to buyers, with the COD collect action).
 * Unassigned shipments are shown too so agents can self-assign by acting.
 */
export default async function AgentTasksPage() {
  const session = await auth();
  const agentId = session!.user.id;

  const [pickups, deliveries] = await Promise.all([
    db.shipment.findMany({
      where: {
        status: "PENDING_PICKUP",
        OR: [{ agentId }, { agentId: null }],
      },
      include: {
        seller: { include: { wilaya: true } },
        order: { include: { shippingAddress: { include: { wilaya: true, commune: true } } } },
      },
      take: 30,
    }),
    db.shipment.findMany({
      where: {
        status: { in: ["IN_TRANSIT", "OUT_FOR_DELIVERY"] },
        OR: [{ agentId }, { agentId: null }],
      },
      include: {
        seller: { include: { wilaya: true } },
        order: { include: { shippingAddress: { include: { wilaya: true, commune: true } } } },
      },
      take: 30,
    }),
  ]);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold text-navy-700">Tâches du jour 📋</h1>

      <Tabs defaultValue="deliveries">
        <TabsList className="w-full">
          <TabsTrigger value="pickups" className="flex-1">
            📦 Ramassages ({pickups.length})
          </TabsTrigger>
          <TabsTrigger value="deliveries" className="flex-1">
            🚚 Livraisons ({deliveries.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pickups" className="space-y-3">
          {pickups.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">Aucun ramassage en attente.</p>
          )}
          {pickups.map((s) => (
            <ShipmentCard
              key={s.id}
              mode="pickup"
              shipment={{
                id: s.id,
                reference: s.order.reference,
                codAmount: s.codAmount,
                sellerName: s.seller.name,
                sellerWilaya: s.seller.wilaya.name,
                buyerName: s.order.shippingAddress?.fullName ?? s.order.guestName ?? "—",
                buyerPhone: s.order.shippingAddress?.phone ?? s.order.guestPhone ?? "",
                destination: s.order.shippingAddress
                  ? `${s.order.shippingAddress.streetAddress}, ${s.order.shippingAddress.commune.name}, ${s.order.shippingAddress.wilaya.name}`
                  : "—",
              }}
            />
          ))}
        </TabsContent>

        <TabsContent value="deliveries" className="space-y-3">
          {deliveries.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">Aucune livraison en cours.</p>
          )}
          {deliveries.map((s) => (
            <ShipmentCard
              key={s.id}
              mode="delivery"
              shipment={{
                id: s.id,
                reference: s.order.reference,
                codAmount: s.codAmount,
                sellerName: s.seller.name,
                sellerWilaya: s.seller.wilaya.name,
                buyerName: s.order.shippingAddress?.fullName ?? s.order.guestName ?? "—",
                buyerPhone: s.order.shippingAddress?.phone ?? s.order.guestPhone ?? "",
                destination: s.order.shippingAddress
                  ? `${s.order.shippingAddress.streetAddress}, ${s.order.shippingAddress.commune.name}, ${s.order.shippingAddress.wilaya.name}`
                  : "—",
              }}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
