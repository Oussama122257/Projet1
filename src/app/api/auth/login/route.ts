import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { parseBody, withErrorHandling, jsonError } from "@/lib/api";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const POST = withErrorHandling(async (req: Request) => {
  const { email, password } = await parseBody(req, schema);

  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  const valid = user && (await verifyPassword(password, user.passwordHash));
  if (!valid) return jsonError(401, "invalid_credentials", "Invalid email or password");

  await setSessionCookie({ userId: user.id, email: user.email });
  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
});
