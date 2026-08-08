import { NextResponse } from "next/server";
import { z } from "zod";
import { recommendSize } from "@/lib/ai/size";

const schema = z.object({
  productId: z.string(),
  weightKg: z.number().min(25).max(250),
  heightCm: z.number().min(100).max(230),
});

/** POST /api/ai/size — "Quelle est ma taille ?" popup (public, no auth). */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Poids (kg) et taille (cm) requis." }, { status: 400 });
  }
  const reco = await recommendSize(parsed.data);
  return NextResponse.json(reco);
}
