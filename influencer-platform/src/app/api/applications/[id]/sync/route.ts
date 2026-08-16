import { fail, handler, ok } from "@/lib/api";
import { prisma, Role } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { syncApplication } from "@/jobs/syncMetrics";

type Params = { params: { id: string } };

/**
 * POST /api/applications/:id/sync
 *
 * Manual refresh for a single application — the "Refresh metrics" button. Runs
 * the same pipeline as the hourly cron, including fraud checks and the payout
 * trigger, so there is exactly one code path that can move money.
 */
export const POST = handler(async (_req: Request, { params }: Params) => {
  const user = await requireUser();

  const application = await prisma.influencerApplication.findUnique({
    where: { id: params.id },
    include: { campaign: { select: { brandId: true } } },
  });
  if (!application) return fail("Application not found", 404);

  const permitted =
    user.role === Role.ADMIN ||
    application.influencerId === user.id ||
    application.campaign.brandId === user.id;
  if (!permitted) return fail("You do not have access to this application", 403);

  const outcome = await syncApplication(params.id);
  return ok(outcome);
});
