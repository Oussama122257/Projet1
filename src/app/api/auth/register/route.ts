import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { parseBody, withErrorHandling, jsonError } from "@/lib/api";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  name: z.string().min(1).max(120),
});

export const POST = withErrorHandling(async (req: Request) => {
  const { email, password, name } = await parseBody(req, schema);

  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return jsonError(409, "email_taken", "An account with this email already exists");

  const user = await db.user.create({
    data: {
      email: email.toLowerCase(),
      name,
      passwordHash: await hashPassword(password),
    },
  });

  await setSessionCookie({ userId: user.id, email: user.email });
  return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
});
