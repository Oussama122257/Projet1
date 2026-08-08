import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const schema = z.object({ action: z.enum(["approve", "reject"]) });

/** PATCH /api/admin/sellers/:id — approve or reject a store application. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Réservé aux admins." }, { status: 403 });
  }

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Action invalide." }, { status: 400 });

  const store = await db.store.update({
    where: { id },
    data: { isActive: parsed.data.action === "approve" },
  });
  if (parsed.data.action === "approve") {
    await db.user.update({ where: { id: store.userId }, data: { isVerified: true } });
  }
  return NextResponse.json({ ok: true, isActive: store.isActive });
}
