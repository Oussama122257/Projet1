import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sendServerPurchase } from "@/lib/meta/capi";

const schema = z.object({ orderId: z.string() });

/**
 * POST /api/pixel/server — manually (re)fire the server-side Meta Purchase
 * for an order. The normal path is automatic on COD collection; this
 * endpoint lets admins replay failed events from the Pixel Manager.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Réservé aux admins." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "orderId requis." }, { status: 400 });

  const order = await db.order.findUnique({
    where: { id: parsed.data.orderId },
    include: { items: true },
  });
  if (!order) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });

  await sendServerPurchase({
    eventId: order.pixelEventId ?? `purchase_${order.reference}`,
    orderId: order.id,
    phone: order.guestPhone,
    firstName: order.guestName?.split(" ")[0],
    value: order.totalAmount,
    contentIds: order.items.map((i) => i.productId),
    numItems: order.items.reduce((s, i) => s + i.quantity, 0),
  });

  return NextResponse.json({ ok: true });
}
