import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { authConfig } from "@/auth.config";
import { normalizeAlgerianPhone } from "@/lib/phone";

const credentialsSchema = z.object({
  phone: z.string().min(9),
  password: z.string().min(6),
});

/**
 * Auth.js v5. Sessions are JWTs (required for Credentials); the Prisma
 * adapter persists Google OAuth accounts. Login identifier is the Algerian
 * phone number — the primary identity in the local market.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "Téléphone",
      credentials: {
        phone: { label: "Téléphone", type: "tel" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const phone = normalizeAlgerianPhone(parsed.data.phone);
        if (!phone) return null;

        const user = await db.user.findUnique({ where: { phone } });
        if (!user?.password) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.password);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        } as { id: string; name: string | null; email: string | null; role: string };
      },
    }),
  ],
});
