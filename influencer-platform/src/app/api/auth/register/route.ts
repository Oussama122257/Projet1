import bcrypt from "bcryptjs";
import { z } from "zod";
import { fail, handler, ok, parseBody } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { prisma, Role } from "@/lib/db";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(80),
  role: z.enum([Role.BRAND, Role.INFLUENCER]),
  companyName: z.string().max(120).optional(),
  handle: z.string().min(2).max(40).regex(/^[a-zA-Z0-9._-]+$/).optional(),
  country: z.string().length(2).optional(),
});

export const POST = handler(async (req: Request) => {
  const body = await parseBody(req, registerSchema);
  const email = body.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return fail("An account with that email already exists", 409);
  }

  if (body.handle) {
    const handleTaken = await prisma.user.findUnique({
      where: { handle: body.handle },
    });
    if (handleTaken) return fail("That handle is already taken", 409);
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: body.name,
      passwordHash: await bcrypt.hash(body.password, 12),
      role: body.role,
      companyName: body.role === Role.BRAND ? body.companyName : null,
      handle: body.role === Role.INFLUENCER ? body.handle : null,
      country: body.country?.toUpperCase(),
    },
    select: { id: true, email: true, name: true, role: true },
  });

  await recordAudit({
    action: "user.registered",
    entityType: "User",
    entityId: user.id,
    actorId: user.id,
    metadata: { role: user.role },
  });

  return ok(user, 201);
});
