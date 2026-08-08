import { CheckoutType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { orderReference } from "@/lib/utils";
import { normalizeAlgerianPhone } from "@/lib/phone";
import { pickCourier } from "@/lib/shipping";
import { courierFor } from "@/lib/delivery";
import { sendServerPurchase } from "@/lib/meta/capi";

// ─────────────────────────────────────────────────────────────────────────────
// FAST CHECKOUT ("Acheter Maintenant")
// Algerian reality: most buyers have no account and pay cash on delivery.
// Only 5 fields required: name, phone, wilaya, commune, address.
// ─────────────────────────────────────────────────────────────────────────────

export interface FastCheckoutInput {
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
  fullName: string;
  phone: string;
  wilayaId: string;
  communeId: string;
  address: string;
  utmSource?: string;
  utmCampaign?: string;
}

export async function createFastOrder(input: FastCheckoutInput) {
  const phone = normalizeAlgerianPhone(input.phone);
  if (!phone) throw new OrderError("Numéro de téléphone invalide (format algérien attendu).");

  const product = await db.product.findUnique({
    where: { id: input.productId },
    include: { store: true },
  });
  if (!product || product.status !== "PUBLISHED") throw new OrderError("Produit indisponible.");
  if (product.stock < input.quantity) throw new OrderError("Stock insuffisant.");
  if (input.size && product.sizes.length > 0 && !product.sizes.includes(input.size)) {
    throw new OrderError("Taille non disponible.");
  }

  const commune = await db.commune.findUnique({ where: { id: input.communeId } });
  if (!commune || commune.wilayaId !== input.wilayaId) {
    throw new OrderError("Commune invalide pour cette wilaya.");
  }

  // Shipping: seller's wilaya → buyer's wilaya, cheapest active courier.
  const { company, fee } = await pickCourier(input.wilayaId);

  const itemsTotal = product.price * input.quantity;
  const total = itemsTotal + fee;
  const commission = itemsTotal * (product.store.commissionRate / 100);
  const reference = orderReference();
  // One eventId reused by browser pixel (now) and server CAPI (on delivery).
  const pixelEventId = `purchase_${reference}`;

  const order = await db.$transaction(async (tx) => {
    const address = await tx.address.create({
      data: {
        fullName: input.fullName,
        phone,
        wilayaId: input.wilayaId,
        communeId: input.communeId,
        streetAddress: input.address,
      },
    });

    const order = await tx.order.create({
      data: {
        reference,
        buyerId: null, // guest checkout — no account needed
        guestName: input.fullName,
        guestPhone: phone,
        totalAmount: total,
        platformFee: commission,
        checkoutType: CheckoutType.FAST,
        utmSource: input.utmSource,
        utmCampaign: input.utmCampaign,
        pixelEventId,
        addressId: address.id,
        items: {
          create: {
            productId: product.id,
            sellerId: product.storeId,
            quantity: input.quantity,
            price: product.price,
            size: input.size,
            color: input.color,
          },
        },
        shipments: {
          create: {
            sellerId: product.storeId,
            deliveryCompany: company,
            shippingFee: fee,
            // COD = product total + shipping, collected in cash by the courier
            codAmount: total,
          },
        },
        transactions: {
          create: {
            sellerId: product.storeId,
            amount: commission,
            type: "COMMISSION",
          },
        },
      },
      include: { shipments: true, items: { include: { product: true } } },
    });

    await tx.product.update({
      where: { id: product.id },
      data: { stock: { decrement: input.quantity }, soldCount: { increment: input.quantity } },
    });

    return order;
  });

  return { order, pixelEventId, shippingFee: fee, company };
}

// ─────────────────────────────────────────────────────────────────────────────
// CART CHECKOUT (multi-vendor)
// One parent Order; one Shipment per store — stores sit in different wilayas,
// so each shipment gets its own courier + delivery fee, and the buyer sees
// the itemized sum before confirming.
// ─────────────────────────────────────────────────────────────────────────────

export interface CartCheckoutInput {
  items: Array<{ productId: string; quantity: number; size?: string; color?: string }>;
  buyerId?: string | null;
  fullName: string;
  phone: string;
  wilayaId: string;
  communeId: string;
  address: string;
  utmSource?: string;
  utmCampaign?: string;
}

export async function createCartOrder(input: CartCheckoutInput) {
  const phone = normalizeAlgerianPhone(input.phone);
  if (!phone) throw new OrderError("Numéro de téléphone invalide.");
  if (input.items.length === 0) throw new OrderError("Panier vide.");

  const products = await db.product.findMany({
    where: { id: { in: input.items.map((i) => i.productId) }, status: "PUBLISHED" },
    include: { store: true },
  });
  if (products.length !== input.items.length) throw new OrderError("Certains produits sont indisponibles.");

  const commune = await db.commune.findUnique({ where: { id: input.communeId } });
  if (!commune || commune.wilayaId !== input.wilayaId) {
    throw new OrderError("Commune invalide pour cette wilaya.");
  }

  // Group items per store → one shipment per store.
  const byStore = new Map<string, Array<{ product: (typeof products)[number]; qty: number; size?: string; color?: string }>>();
  for (const item of input.items) {
    const product = products.find((p) => p.id === item.productId)!;
    if (product.stock < item.quantity) throw new OrderError(`Stock insuffisant: ${product.name}`);
    const list = byStore.get(product.storeId) ?? [];
    list.push({ product, qty: item.quantity, size: item.size, color: item.color });
    byStore.set(product.storeId, list);
  }

  // Compute per-shipment shipping fees up front (one fee per seller store).
  const shipmentPlans: Array<{
    sellerId: string;
    company: Awaited<ReturnType<typeof pickCourier>>["company"];
    fee: number;
    itemsTotal: number;
    commission: number;
  }> = [];
  for (const [sellerId, list] of byStore) {
    const { company, fee } = await pickCourier(input.wilayaId);
    const itemsTotal = list.reduce((sum, l) => sum + l.product.price * l.qty, 0);
    const rate = list[0].product.store.commissionRate;
    shipmentPlans.push({ sellerId, company, fee, itemsTotal, commission: itemsTotal * (rate / 100) });
  }

  const itemsTotal = shipmentPlans.reduce((s, p) => s + p.itemsTotal, 0);
  const shippingTotal = shipmentPlans.reduce((s, p) => s + p.fee, 0);
  const platformFee = shipmentPlans.reduce((s, p) => s + p.commission, 0);
  const total = itemsTotal + shippingTotal;
  const reference = orderReference();
  const pixelEventId = `purchase_${reference}`;

  const order = await db.$transaction(async (tx) => {
    const address = await tx.address.create({
      data: {
        userId: input.buyerId ?? null,
        fullName: input.fullName,
        phone,
        wilayaId: input.wilayaId,
        communeId: input.communeId,
        streetAddress: input.address,
      },
    });

    const order = await tx.order.create({
      data: {
        reference,
        buyerId: input.buyerId ?? null,
        guestName: input.buyerId ? null : input.fullName,
        guestPhone: input.buyerId ? null : phone,
        totalAmount: total,
        platformFee,
        checkoutType: CheckoutType.CART,
        utmSource: input.utmSource,
        utmCampaign: input.utmCampaign,
        pixelEventId,
        addressId: address.id,
      },
    });

    for (const [sellerId, list] of byStore) {
      const plan = shipmentPlans.find((p) => p.sellerId === sellerId)!;
      await tx.shipment.create({
        data: {
          orderId: order.id,
          sellerId,
          deliveryCompany: plan.company,
          shippingFee: plan.fee,
          codAmount: plan.itemsTotal + plan.fee,
        },
      });
      await tx.transaction.create({
        data: { sellerId, orderId: order.id, amount: plan.commission, type: "COMMISSION" },
      });
      for (const l of list) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: l.product.id,
            sellerId,
            quantity: l.qty,
            price: l.product.price,
            size: l.size,
            color: l.color,
          },
        });
        await tx.product.update({
          where: { id: l.product.id },
          data: { stock: { decrement: l.qty }, soldCount: { increment: l.qty } },
        });
      }
    }

    return tx.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { shipments: true, items: { include: { product: true } } },
    });
  });

  return {
    order,
    pixelEventId,
    breakdown: { itemsTotal, shippingTotal, total, shipmentCount: shipmentPlans.length },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COD RECONCILIATION — the money moment.
// Agent taps "Collected ✅" → 3 things happen atomically:
//   1. Shipment → DELIVERED (+ timestamps, proof, actual cash)
//   2. PAYOUT transaction = codAmount − commission − shippingFee
//   3. Store.balance credited
// Then the server-side Meta Purchase event fires (same eventId → dedup).
// ─────────────────────────────────────────────────────────────────────────────

export async function collectShipmentCOD(params: {
  shipmentId: string;
  agentId: string;
  actualCollected?: number;
  agentNote?: string;
  signatureUrl?: string;
}) {
  const result = await db.$transaction(async (tx) => {
    const shipment = await tx.shipment.findUnique({
      where: { id: params.shipmentId },
      include: {
        seller: true,
        order: { include: { items: { where: {} } } },
      },
    });
    if (!shipment) throw new OrderError("Expédition introuvable.");
    if (shipment.status === "DELIVERED") throw new OrderError("Déjà encaissée.");

    const collected = params.actualCollected ?? shipment.codAmount;
    // Seller items total for THIS shipment (COD minus the shipping fee).
    const sellerItemsTotal = shipment.codAmount - shipment.shippingFee;
    const commission = sellerItemsTotal * (shipment.seller.commissionRate / 100);
    // What the seller earns: goods value − Zeem commission.
    // (Shipping fee goes to the courier, commission to the platform.)
    const sellerPayout = Math.max(0, sellerItemsTotal - commission);

    // 1. Mark delivered
    const updated = await tx.shipment.update({
      where: { id: shipment.id },
      data: {
        status: "DELIVERED",
        actualCollected: collected,
        agentId: params.agentId,
        agentNote: params.agentNote,
        signatureUrl: params.signatureUrl,
        deliveredAt: new Date(),
      },
    });

    // 2. Payout transaction (due next weekly payout cycle)
    await tx.transaction.create({
      data: {
        sellerId: shipment.sellerId,
        orderId: shipment.orderId,
        amount: sellerPayout,
        type: "PAYOUT",
        status: "PENDING",
        dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      },
    });

    // 3. Credit store balance
    await tx.store.update({
      where: { id: shipment.sellerId },
      data: { balance: { increment: sellerPayout } },
    });

    // If every shipment of the parent order is delivered → order DELIVERED.
    const siblings = await tx.shipment.findMany({ where: { orderId: shipment.orderId } });
    const allDelivered = siblings.every((s) => s.id === shipment.id || s.status === "DELIVERED");
    const order = await tx.order.update({
      where: { id: shipment.orderId },
      data: allDelivered ? { status: "DELIVERED" } : {},
      include: { items: true },
    });

    return { shipment: updated, order, sellerPayout };
  });

  // Fire server-side Meta Purchase (outside the DB transaction — network I/O).
  const { order } = result;
  if (order.pixelEventId) {
    await sendServerPurchase({
      eventId: order.pixelEventId,
      orderId: order.id,
      phone: order.guestPhone,
      firstName: order.guestName?.split(" ")[0],
      value: order.totalAmount,
      contentIds: order.items.map((i) => i.productId),
      numItems: order.items.reduce((s, i) => s + i.quantity, 0),
    });
  }

  return result;
}

/** Generate + attach a courier waybill for a shipment (auto on confirmation). */
export async function generateWaybill(shipmentId: string) {
  const shipment = await db.shipment.findUnique({
    where: { id: shipmentId },
    include: {
      order: {
        include: {
          shippingAddress: { include: { wilaya: true, commune: true } },
          items: { include: { product: true } },
        },
      },
    },
  });
  if (!shipment) throw new OrderError("Expédition introuvable.");
  const addr = shipment.order.shippingAddress;
  if (!addr) throw new OrderError("Adresse de livraison manquante.");

  const myItems = shipment.order.items.filter((i) => i.sellerId === shipment.sellerId);
  const adapter = courierFor(shipment.deliveryCompany);
  const result = await adapter.createWaybill({
    shipmentId: shipment.id,
    orderReference: shipment.order.reference,
    recipientName: addr.fullName,
    recipientPhone: addr.phone,
    wilayaName: addr.wilaya.name,
    wilayaCode: addr.wilaya.code,
    communeName: addr.commune.name,
    address: addr.streetAddress,
    codAmount: shipment.codAmount,
    weightKg: myItems.reduce((s, i) => s + (i.product.weight ?? 0.5) * i.quantity, 0),
    productList: myItems.map((i) => `${i.quantity}x ${i.product.name}`).join(", "),
  });

  return db.shipment.update({
    where: { id: shipment.id },
    data: { trackingNumber: result.trackingNumber, waybillUrl: result.waybillUrl },
  });
}

export class OrderError extends Error {}

export type { Prisma };
