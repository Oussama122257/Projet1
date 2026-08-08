import { NextResponse } from "next/server";
import { z } from "zod";
import { createFastOrder, OrderError } from "@/lib/orders";

const schema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1).max(10).default(1),
  size: z.string().optional(),
  color: z.string().optional(),
  fullName: z.string().min(3),
  phone: z.string().min(9),
  wilayaId: z.string(),
  communeId: z.string(),
  address: z.string().min(5),
  utmSource: z.string().optional(),
  utmCampaign: z.string().optional(),
});

/**
 * POST /api/orders/fast — "Acheter Maintenant".
 * Guest COD order in one call: 5 fields, no account.
 * Returns pixelEventId: the client fires the browser `Purchase` event with
 * it; the matching server CAPI event fires later on COD collection (dedup).
 */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Formulaire incomplet." }, { status: 400 });
  }

  try {
    const { order, pixelEventId, shippingFee, company } = await createFastOrder(parsed.data);
    return NextResponse.json(
      {
        reference: order.reference,
        total: order.totalAmount,
        shippingFee,
        deliveryCompany: company,
        pixelEventId,
        pixelValue: order.totalAmount,
        contentIds: order.items.map((i) => i.productId),
      },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("fast checkout failed", e);
    return NextResponse.json({ error: "Erreur serveur, réessayez." }, { status: 500 });
  }
}
