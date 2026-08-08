import { DeliveryCompany } from "@prisma/client";
import { db } from "@/lib/db";
import { cached } from "@/lib/redis";
import { ZONE_FEES } from "@/data/wilayas";

export type DeliveryMode = "HOME" | "DESK";

/**
 * Shipping fee for delivering to `wilayaId` with a given courier.
 * Priority: explicit Delivery row (admin-managed) → zone fallback grid.
 * Cached in Redis for 1h — fees change rarely, checkout runs constantly.
 */
export async function getShippingFee(
  wilayaId: string,
  company: DeliveryCompany = "YALIDINE",
  mode: DeliveryMode = "HOME"
): Promise<number> {
  return cached(`fee:${company}:${wilayaId}:${mode}`, 3600, async () => {
    const row = await db.delivery.findUnique({
      where: { company_wilayaId: { company, wilayaId } },
    });
    if (row && row.isActive) return mode === "HOME" ? row.homeFee : row.deskFee;

    const wilaya = await db.wilaya.findUnique({ where: { id: wilayaId } });
    const zone = ZONE_FEES[wilaya?.zone ?? 1];
    return mode === "HOME" ? zone.home : zone.desk;
  });
}

/**
 * Pick the cheapest ACTIVE courier for a destination wilaya.
 * Used when the seller has no preference; sellers/admin can override.
 */
export async function pickCourier(
  wilayaId: string,
  mode: DeliveryMode = "HOME"
): Promise<{ company: DeliveryCompany; fee: number }> {
  const rows = await db.delivery.findMany({
    where: { wilayaId, isActive: true },
  });
  if (rows.length === 0) {
    // No configured courier → default to Yalidine on zone pricing.
    return { company: "YALIDINE", fee: await getShippingFee(wilayaId, "YALIDINE", mode) };
  }
  const best = rows.reduce((a, b) =>
    (mode === "HOME" ? a.homeFee : a.deskFee) <= (mode === "HOME" ? b.homeFee : b.deskFee) ? a : b
  );
  return { company: best.company, fee: mode === "HOME" ? best.homeFee : best.deskFee };
}
