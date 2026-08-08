import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { suggestPrice } from "@/lib/ai/price";

const schema = z.object({ category: z.string().min(2) });

/**
 * POST /api/ai/suggest-price — competitive price band from the average of
 * similar products in the seller's own wilaya (national fallback).
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Réservé aux vendeurs." }, { status: 403 });
  }
  const store = await db.store.findUnique({ where: { userId: session.user.id } });
  if (!store) return NextResponse.json({ error: "Boutique introuvable." }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Catégorie requise." }, { status: 400 });

  const suggestion = await suggestPrice({
    category: parsed.data.category,
    storeWilayaId: store.wilayaId,
    excludeStoreId: store.id,
  });
  return NextResponse.json(suggestion);
}
