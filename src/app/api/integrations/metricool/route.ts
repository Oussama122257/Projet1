import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { encryptSecret } from "@/lib/crypto";
import { MetricoolClient, MetricoolApiError } from "@/lib/metricool";
import { parseBody, requireSession, withErrorHandling, jsonError } from "@/lib/api";

export const GET = withErrorHandling(async () => {
  const session = await requireSession();
  const connections = await db.metricoolConnection.findMany({
    where: { userId: session.userId },
    select: {
      id: true,
      metricoolUserId: true,
      status: true,
      brandsJson: true,
      lastCheckedAt: true,
      createdAt: true,
      // encryptedUserToken intentionally excluded — never leaves the server
    },
  });
  return NextResponse.json(connections);
});

const connectSchema = z.object({
  userToken: z.string().min(8),
  metricoolUserId: z.string().min(1),
});

export const POST = withErrorHandling(async (req: Request) => {
  const session = await requireSession();
  const { userToken, metricoolUserId } = await parseBody(req, connectSchema);

  // Validate credentials with a live call to the official API before saving.
  const client = new MetricoolClient({ userToken, userId: metricoolUserId });
  let brands;
  try {
    brands = await client.getBrands();
  } catch (err) {
    if (err instanceof MetricoolApiError && err.isAuthError) {
      return jsonError(400, "invalid_credentials", "Metricool rejected this token/userId");
    }
    throw err;
  }

  const connection = await db.metricoolConnection.create({
    data: {
      userId: session.userId,
      encryptedUserToken: encryptSecret(userToken),
      metricoolUserId,
      status: "CONNECTED",
      brandsJson: brands as object,
      lastCheckedAt: new Date(),
    },
    select: { id: true, metricoolUserId: true, status: true, brandsJson: true },
  });
  return NextResponse.json(connection, { status: 201 });
});

export const DELETE = withErrorHandling(async (req: Request) => {
  const session = await requireSession();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return jsonError(400, "missing_id", "Connection id required");
  const connection = await db.metricoolConnection.findUnique({ where: { id } });
  if (!connection || connection.userId !== session.userId) {
    return jsonError(404, "not_found", "Connection not found");
  }
  await db.metricoolConnection.update({ where: { id }, data: { status: "DISCONNECTED" } });
  return NextResponse.json({ ok: true });
});
