import { z } from "zod";
import { fail, handler, ok, parseBody } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { prisma, CampaignStatus, Platform, Role } from "@/lib/db";
import { requireUser } from "@/lib/session";

type Params = { params: { id: string } };

const updateSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().max(4000).optional(),
  brief: z.string().max(8000).optional(),
  budgetCents: z.number().int().min(1000).optional(),
  minPayoutThresholdCents: z.number().int().min(100).optional(),
  platforms: z.array(z.nativeEnum(Platform)).min(1).optional(),
  status: z.nativeEnum(CampaignStatus).optional(),
  endDate: z.coerce.date().optional(),
  requirements: z.string().max(4000).optional(),
  hashtags: z.array(z.string().max(60)).max(20).optional(),
});

async function loadOwned(id: string, userId: string, role: Role) {
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) return { campaign: null, forbidden: false };
  if (role !== Role.ADMIN && campaign.brandId !== userId) {
    return { campaign, forbidden: true };
  }
  return { campaign, forbidden: false };
}

export const GET = handler(async (_req: Request, { params }: Params) => {
  const user = await requireUser();

  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id },
    include: {
      brand: {
        select: { id: true, name: true, companyName: true, image: true, website: true },
      },
      applications: {
        include: {
          influencer: {
            select: {
              id: true,
              name: true,
              handle: true,
              image: true,
              country: true,
              verification: true,
              socialLinks: {
                select: { platform: true, username: true, followerCount: true },
              },
            },
          },
          snapshots: {
            orderBy: { capturedAt: "asc" },
            select: { capturedAt: true, views: true, clicks: true, earningsCents: true },
          },
          fraudFlags: {
            where: { resolvedAt: null },
            select: { id: true, reason: true, severity: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!campaign) return fail("Campaign not found", 404);

  const isOwner = campaign.brandId === user.id;
  const isAdmin = user.role === Role.ADMIN;

  // Influencers browsing the marketplace may read the brief, but not the roster
  // of who else applied or anyone's earnings.
  if (!isOwner && !isAdmin) {
    const { applications, ...publicFields } = campaign;
    const mine = applications.find((a) => a.influencerId === user.id) ?? null;
    return ok({
      ...publicFields,
      applicantCount: applications.length,
      myApplication: mine,
    });
  }

  return ok(campaign);
});

export const PATCH = handler(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const { campaign, forbidden } = await loadOwned(params.id, user.id, user.role);

  if (!campaign) return fail("Campaign not found", 404);
  if (forbidden) return fail("You do not own this campaign", 403);

  const body = await parseBody(req, updateSchema);

  // Budget can rise freely but must never fall below money already accrued,
  // which would strand influencers with unpayable balances.
  if (body.budgetCents !== undefined && body.budgetCents < campaign.spentCents) {
    return fail(
      `Budget cannot be lowered below the ${(campaign.spentCents / 100).toFixed(2)} already accrued`,
      422
    );
  }

  const updated = await prisma.campaign.update({
    where: { id: params.id },
    data: body,
  });

  await recordAudit({
    action: "campaign.updated",
    entityType: "Campaign",
    entityId: updated.id,
    actorId: user.id,
    metadata: { changes: Object.keys(body) },
  });

  return ok(updated);
});

export const DELETE = handler(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { campaign, forbidden } = await loadOwned(params.id, user.id, user.role);

  if (!campaign) return fail("Campaign not found", 404);
  if (forbidden) return fail("You do not own this campaign", 403);

  // Campaigns with financial history are archived, never destroyed — the audit
  // trail and payout records must stay intact for dispute resolution.
  if (campaign.spentCents > 0) {
    const archived = await prisma.campaign.update({
      where: { id: params.id },
      data: { status: CampaignStatus.ARCHIVED },
    });
    await recordAudit({
      action: "campaign.archived",
      entityType: "Campaign",
      entityId: archived.id,
      actorId: user.id,
      metadata: { reason: "delete requested with spend on record" },
    });
    return ok({ archived: true, campaign: archived });
  }

  await prisma.campaign.delete({ where: { id: params.id } });
  await recordAudit({
    action: "campaign.deleted",
    entityType: "Campaign",
    entityId: params.id,
    actorId: user.id,
  });

  return ok({ deleted: true });
});
