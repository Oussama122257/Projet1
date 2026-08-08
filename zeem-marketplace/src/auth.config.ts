import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Edge-safe Auth.js config (no Prisma import) — used by middleware.
 * The Credentials provider + adapter live in src/auth.ts (Node runtime only).
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  // Required for self-hosted deployments (Docker/Render/VPS) — without it,
  // Auth.js v5 rejects logins with an UntrustedHost error outside Vercel.
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = (user as { id?: string }).id;
        token.role = (user as { role?: string }).role ?? "BUYER";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        (session.user as { role?: string }).role = (token.role as string) ?? "BUYER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
