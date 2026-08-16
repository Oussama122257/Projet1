import { prisma } from "./db";
import { createLogger } from "./logger";
import type { Prisma } from "@prisma/client";

const log = createLogger("audit");

export type AuditInput = {
  action: string;
  entityType: string;
  entityId: string;
  actorId?: string | null;
  actorLabel?: string;
  metadata?: Prisma.InputJsonValue;
};

/**
 * Append-only record of every meaningful state transition.
 *
 * Payout disputes are resolved by reading this table, so writes must never take
 * a request down: a failed audit write is logged, not thrown. Accepts an
 * optional transaction client so a transition and its audit row commit together.
 */
export async function recordAudit(
  input: AuditInput,
  tx: Prisma.TransactionClient | typeof prisma = prisma
): Promise<void> {
  try {
    await tx.auditEvent.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        actorId: input.actorId ?? null,
        actorLabel: input.actorLabel ?? (input.actorId ? "user" : "system:cron"),
        metadata: input.metadata,
      },
    });
  } catch (err) {
    log.error("failed to write audit event", {
      action: input.action,
      entityId: input.entityId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function auditTrailFor(entityType: string, entityId: string) {
  return prisma.auditEvent.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { id: true, name: true, email: true } } },
  });
}
