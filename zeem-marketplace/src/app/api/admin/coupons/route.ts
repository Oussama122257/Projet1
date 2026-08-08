import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/** Marketing Hub — coupon CRUD (admin only). */
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Réservé aux admins." }, { status: 403 });
  }
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ coupons });
}

const createSchema = z.object({
  code: z.string().min(3).max(20).transform((c) => c.toUpperCase()),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.number().positive(),
  minAmount: z.number().positive().optional(),
  maxUses: z.number().int().positive().default(100),
  expiresAt: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Réservé aux admins." }, { status: 403 });
  }
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Champs invalides." }, { status: 400 });
  if (parsed.data.type === "PERCENT" && parsed.data.value > 90) {
    return NextResponse.json({ error: "Réduction maximum: 90%." }, { status: 400 });
  }

  const coupon = await db.coupon.create({
    data: {
      ...parsed.data,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    },
  });
  return NextResponse.json({ coupon }, { status: 201 });
}
