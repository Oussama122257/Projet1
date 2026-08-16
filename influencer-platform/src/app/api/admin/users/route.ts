import { z } from "zod";
import { handler, ok, parseBody } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { prisma, Role, VerificationStatus } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const GET = handler(async (req: Request) => {
  await requireAdmin();
  const url = new URL(req.url);
  const role = url.searchParams.get("role") as Role | null;
  const query = url.searchParams.get("q")?.trim();

  const users = await prisma.user.findMany({
    where: {
      ...(role ? { role } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" as const } },
              { email: { contains: query, mode: "insensitive" as const } },
              { handle: { contains: query, mode: "insensitive" as const } },
              { companyName: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      handle: true,
      image: true,
      role: true,
      country: true,
      companyName: true,
      verification: true,
      stripeConnectedStatus: true,
      stripePayoutsEnabled: true,
      createdAt: true,
      _count: { select: { applications: true, campaigns: true, payouts: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return ok(users);
});

const updateSchema = z.object({
  userId: z.string().min(1),
  verification: z.nativeEnum(VerificationStatus),
  note: z.string().max(500).optional(),
});

/** POST /api/admin/users — change a user's verification status. */
export const POST = handler(async (req: Request) => {
  const admin = await requireAdmin();
  const body = await parseBody(req, updateSchema);

  const user = await prisma.user.update({
    where: { id: body.userId },
    data: { verification: body.verification },
    select: { id: true, verification: true, email: true },
  });

  await recordAudit({
    action: "user.verification_changed",
    entityType: "User",
    entityId: user.id,
    actorId: admin.id,
    actorLabel: "admin",
    metadata: { verification: body.verification, note: body.note },
  });

  return ok(user);
});
