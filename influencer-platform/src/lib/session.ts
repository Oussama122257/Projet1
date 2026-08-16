import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma, Role } from "./db";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? null,
    role: session.user.role,
  };
}

/** Full database record for the signed-in user, or null. */
export async function getCurrentUserRecord() {
  const session = await getCurrentUser();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.id } });
}

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Authentication required", 401);
  return user;
}

/** Admins pass every role check — they need to act on any resource in support. */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role) && user.role !== Role.ADMIN) {
    throw new AuthError(
      `This action requires the ${roles.join(" or ")} role`,
      403
    );
  }
  return user;
}

export const requireBrand = () => requireRole(Role.BRAND);
export const requireInfluencer = () => requireRole(Role.INFLUENCER);

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== Role.ADMIN) {
    throw new AuthError("Administrator access required", 403);
  }
  return user;
}
