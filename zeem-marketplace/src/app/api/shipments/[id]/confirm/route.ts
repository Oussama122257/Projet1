import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateWaybill, OrderError } from "@/lib/orders";

/**
 * POST /api/shipments/:id/confirm — seller confirms the COD order:
 * auto-generates the courier waybill (Yalidine / ZR Express / Poste) and
 * moves the parent order to CONFIRMED.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "SELLER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Réservé aux vendeurs." }, { status: 403 });
  }

  const { id } = await params;
  const shipment = await db.shipment.findUnique({ where: { id }, include: { seller: true } });
  if (!shipment) return NextResponse.json({ error: "Expédition introuvable." }, { status: 404 });
  if (session.user.role === "SELLER" && shipment.seller.userId !== session.user.id) {
    return NextResponse.json({ error: "Cette expédition n'est pas la vôtre." }, { status: 403 });
  }

  try {
    const updated = await generateWaybill(id);
    await db.order.update({
      where: { id: shipment.orderId },
      data: { status: "CONFIRMED" },
    });
    return NextResponse.json({
      ok: true,
      trackingNumber: updated.trackingNumber,
      waybillUrl: updated.waybillUrl,
    });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("confirm failed", e);
    return NextResponse.json({ error: "Erreur lors de la génération du bordereau." }, { status: 500 });
  }
}
