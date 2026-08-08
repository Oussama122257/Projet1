import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { normalizeAlgerianPhone } from "@/lib/phone";
import { slugify } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().min(9),
  password: z.string().min(6),
  email: z.string().email().optional().or(z.literal("")),
  role: z.enum(["BUYER", "SELLER"]).default("BUYER"),
  // Seller-only fields
  storeName: z.string().min(2).optional(),
  wilayaId: z.string().optional(),
});

/**
 * Registration. Buyers register with phone+password. Sellers additionally
 * create their Store, attached to ONE wilaya (mandatory business rule) —
 * the store stays inactive until an admin validates it.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Champs invalides." }, { status: 400 });
  }
  const data = parsed.data;

  const phone = normalizeAlgerianPhone(data.phone);
  if (!phone) {
    return NextResponse.json({ error: "Numéro de téléphone algérien invalide." }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { phone } });
  if (existing) {
    return NextResponse.json({ error: "Ce numéro est déjà inscrit." }, { status: 409 });
  }

  if (data.role === "SELLER" && (!data.storeName || !data.wilayaId)) {
    return NextResponse.json(
      { error: "Nom de boutique et wilaya requis pour les vendeurs." },
      { status: 400 }
    );
  }

  const user = await db.user.create({
    data: {
      name: data.name,
      phone,
      email: data.email || null,
      password: await bcrypt.hash(data.password, 10),
      role: data.role,
    },
  });

  if (data.role === "SELLER") {
    let slug = slugify(data.storeName!);
    if (await db.store.findUnique({ where: { slug } })) {
      slug = `${slug}-${user.id.slice(-4)}`;
    }
    await db.store.create({
      data: {
        userId: user.id,
        name: data.storeName!,
        slug,
        wilayaId: data.wilayaId!,
        isActive: false, // awaiting admin verification
      },
    });
  }

  return NextResponse.json({ ok: true, userId: user.id }, { status: 201 });
}
