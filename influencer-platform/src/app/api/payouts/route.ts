import { handler, ok } from "@/lib/api";
import { prisma, PayoutState, Role } from "@/lib/db";
import { requireUser } from "@/lib/session";

/**
 * GET /api/payouts — payout history.
 *
 * Influencers see their own transfers; brands see payouts made against their
 * campaigns; admins see everything.
 */
export const GET = handler(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const status = url.searchParams.get("status") as PayoutState | null;
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);

  const where =
    user.role === Role.INFLUENCER
      ? { influencerId: user.id }
      : user.role === Role.BRAND
        ? { application: { campaign: { brandId: user.id } } }
        : {};

  const payouts = await prisma.payout.findMany({
    where: { ...where, ...(status ? { status } : {}) },
    include: {
      influencer: { select: { id: true, name: true, handle: true, image: true } },
      application: {
        select: {
          id: true,
          platform: true,
          contentUrl: true,
          campaign: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const totals = await prisma.payout.groupBy({
    by: ["status"],
    where,
    _sum: { amountCents: true },
    _count: true,
  });

  return ok({
    payouts,
    totals: Object.fromEntries(
      totals.map((t) => [
        t.status,
        { count: t._count, amountCents: t._sum.amountCents ?? 0 },
      ])
    ),
  });
});
