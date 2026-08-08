import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { collectShipmentCOD, OrderError } from "@/lib/orders";

const schema = z.object({
  actualCollected: z.number().min(0).optional(),
  agentNote: z.string().optional(),
  signatureUrl: z.string().optional(),
});

/**
 * POST /api/shipments/:id/collect — agent taps "Collecté ✅".
 * Atomically: shipment → DELIVERED, PAYOUT transaction created, store
 * balance credited. Then fires the server-side Meta Purchase (CAPI) with the
 * order's original eventId so Meta deduplicates against the browser event.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "AGENT" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Réservé aux agents de livraison." }, { status: 403 });
  }

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Champs invalides." }, { status: 400 });

  try {
    const result = await collectShipmentCOD({
      shipmentId: id,
      agentId: session.user.id,
      ...parsed.data,
    });
    return NextResponse.json({
      ok: true,
      shipmentStatus: result.shipment.status,
      orderStatus: result.order.status,
      sellerPayout: result.sellerPayout,
    });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("collect failed", e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
