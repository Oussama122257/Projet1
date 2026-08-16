import { z } from "zod";
import { fail, handler, ok, parseBody } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { prisma, ApplicationStatus, Platform, Role } from "@/lib/db";
import { requireUser } from "@/lib/session";

type Params = { params: { id: string } };

const decisionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().max(1000).optional(),
});

const contentSchema = z.object({
  contentId: z.string().min(1).max(200),
  contentUrl: z.string().url(),
  platform: z.nativeEnum(Platform),
  postedAt: z.coerce.date().optional(),
});

export const GET = handler(async (_req: Request, { params }: Params) => {
  const user = await requireUser();

  const application = await prisma.influencerApplication.findUnique({
    where: { id: params.id },
    include: {
      campaign: { include: { brand: { select: { id: true, name: true, companyName: true } } } },
      influencer: {
        select: {
          id: true,
          name: true,
          handle: true,
          image: true,
          country: true,
          verification: true,
          stripeConnectedStatus: true,
        },
      },
      snapshots: { orderBy: { capturedAt: "asc" } },
      fraudFlags: { orderBy: { createdAt: "desc" } },
      payouts: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!application) return fail("Application not found", 404);

  const permitted =
    user.role === Role.ADMIN ||
    application.influencerId === user.id ||
    application.campaign.brandId === user.id;

  if (!permitted) return fail("You do not have access to this application", 403);

  return ok(application);
});

/**
 * PATCH /api/applications/:id
 *
 * Two distinct operations share this route because they are both "update the
 * application": the brand approving/rejecting, and the influencer attaching the
 * content they published. Each is authorised separately.
 */
export const PATCH = handler(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const body = (await req.json()) as unknown;

  const application = await prisma.influencerApplication.findUnique({
    where: { id: params.id },
    include: { campaign: true },
  });
  if (!application) return fail("Application not found", 404);

  // --- brand decision -----------------------------------------------------
  const asDecision = decisionSchema.safeParse(body);
  if (asDecision.success) {
    const isOwner = application.campaign.brandId === user.id;
    if (!isOwner && user.role !== Role.ADMIN) {
      return fail("Only the campaign owner can review applications", 403);
    }
    if (application.status !== ApplicationStatus.PENDING) {
      return fail(
        `This application has already been ${application.status.toLowerCase()}`,
        409
      );
    }

    const approved = asDecision.data.action === "approve";
    const updated = await prisma.influencerApplication.update({
      where: { id: params.id },
      data: {
        status: approved ? ApplicationStatus.APPROVED : ApplicationStatus.REJECTED,
        reviewedAt: new Date(),
        rejectReason: approved ? null : asDecision.data.reason,
      },
    });

    await recordAudit({
      action: approved ? "application.approved" : "application.rejected",
      entityType: "InfluencerApplication",
      entityId: updated.id,
      actorId: user.id,
      metadata: {
        campaignId: application.campaignId,
        influencerId: application.influencerId,
        reason: asDecision.data.reason,
      },
    });

    return ok(updated);
  }

  // --- influencer attaching content --------------------------------------
  const asContent = contentSchema.safeParse(body);
  if (asContent.success) {
    if (application.influencerId !== user.id && user.role !== Role.ADMIN) {
      return fail("You can only submit content for your own application", 403);
    }
    if (application.status !== ApplicationStatus.APPROVED) {
      return fail("Your application must be approved before submitting content", 422);
    }
    if (!application.campaign.platforms.includes(asContent.data.platform)) {
      return fail(
        `This campaign does not run on ${asContent.data.platform}`,
        422
      );
    }

    const updated = await prisma.influencerApplication.update({
      where: { id: params.id },
      data: {
        contentId: asContent.data.contentId,
        contentUrl: asContent.data.contentUrl,
        platform: asContent.data.platform,
        postedAt: asContent.data.postedAt ?? new Date(),
      },
    });

    await recordAudit({
      action: "application.content_submitted",
      entityType: "InfluencerApplication",
      entityId: updated.id,
      actorId: user.id,
      metadata: {
        platform: asContent.data.platform,
        contentId: asContent.data.contentId,
      },
    });

    return ok(updated);
  }

  return fail(
    "Request body did not match either an approve/reject decision or a content submission",
    422
  );
});
