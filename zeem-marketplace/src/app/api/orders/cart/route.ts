import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { createCartOrder, OrderError } from "@/lib/orders";

const schema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1).max(10),
        size: z.string().optional(),
        color: z.string().optional(),
      })
    )
    .min(1),
  fullName: z.string().min(3),
  phone: z.string().min(9),
  wilayaId: z.string(),
  communeId: z.string(),
  address: z.string().min(5),
  utmSource: z.string().optional(),
  utmCampaign: z.string().optional(),
});

/**
 * POST /api/orders/cart — multi-vendor checkout.
 * Splits into one Shipment per store (each with its own delivery fee), under
 * a single parent Order. Works for guests AND logged-in buyers (order is
 * attached to their account so addresses/history are saved).
 */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Formulaire incomplet." }, { status: 400 });
  }

  const session = await auth();

  try {
    const { order, pixelEventId, breakdown } = await createCartOrder({
      ...parsed.data,
      buyerId: session?.user?.id ?? null,
    });
    return NextResponse.json(
      {
        reference: order.reference,
        total: breakdown.total,
        itemsTotal: breakdown.itemsTotal,
        shippingTotal: breakdown.shippingTotal,
        shipmentCount: breakdown.shipmentCount,
        shipments: order.shipments.map((s) => ({
          id: s.id,
          company: s.deliveryCompany,
          fee: s.shippingFee,
          cod: s.codAmount,
        })),
        pixelEventId,
        contentIds: order.items.map((i) => i.productId),
        suggestRegister: !session?.user, // UI prompts guest to create account
      },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("cart checkout failed", e);
    return NextResponse.json({ error: "Erreur serveur, réessayez." }, { status: 500 });
  }
}
