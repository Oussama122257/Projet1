import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

/** GET — full courier coverage grid; PATCH — toggle/edit a wilaya's row. */
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Réservé aux admins." }, { status: 403 });
  }
  const deliveries = await db.delivery.findMany({
    include: { wilaya: { select: { name: true, code: true } } },
    orderBy: [{ company: "asc" }, { wilaya: { code: "asc" } }],
  });
  return NextResponse.json({ deliveries });
}

const patchSchema = z.object({
  id: z.string(),
  isActive: z.boolean().optional(),
  homeFee: z.number().min(0).optional(),
  deskFee: z.number().min(0).optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Réservé aux admins." }, { status: 403 });
  }
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Champs invalides." }, { status: 400 });

  const { id, ...data } = parsed.data;
  const row = await db.delivery.update({ where: { id }, data });

  // Invalidate the cached fee for this courier/wilaya (both modes).
  if (redis) {
    await redis.del(`fee:${row.company}:${row.wilayaId}:HOME`, `fee:${row.company}:${row.wilayaId}:DESK`);
  }
  return NextResponse.json({ ok: true, delivery: row });
}
