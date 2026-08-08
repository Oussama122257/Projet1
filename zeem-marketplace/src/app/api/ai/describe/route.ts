import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { generateDescription } from "@/lib/ai/describe";

const schema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  price: z.number().optional(),
  keywords: z.string().optional(),
});

/** POST /api/ai/describe — "Générer avec IA" on the seller product form. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "SELLER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Réservé aux vendeurs." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Champs invalides." }, { status: 400 });

  try {
    const result = await generateDescription(parsed.data);
    return NextResponse.json(result);
  } catch (e) {
    console.error("ai describe failed", e);
    return NextResponse.json({ error: "Génération IA indisponible." }, { status: 502 });
  }
}
