import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** GET /api/orders/ZM-XXXXXX — public order tracking (reference is the secret). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ reference: string }> }
) {
  const { reference } = await params;
  const order = await db.order.findUnique({
    where: { reference: reference.toUpperCase() },
    include: {
      items: { include: { product: { select: { name: true, images: true, slug: true } } } },
      shipments: { include: { seller: { select: { name: true } } } },
      shippingAddress: { include: { wilaya: true, commune: true } },
    },
  });
  if (!order) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });

  return NextResponse.json({
    order: {
      reference: order.reference,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      items: order.items.map((i) => ({
        name: i.product.name,
        slug: i.product.slug,
        image: i.product.images[0] ?? null,
        quantity: i.quantity,
        price: i.price,
        size: i.size,
        color: i.color,
      })),
      shipments: order.shipments.map((s) => ({
        seller: s.seller.name,
        company: s.deliveryCompany,
        tracking: s.trackingNumber,
        status: s.status,
        fee: s.shippingFee,
        cod: s.codAmount,
      })),
      destination: order.shippingAddress
        ? `${order.shippingAddress.commune.name}, ${order.shippingAddress.wilaya.name}`
        : null,
    },
  });
}
