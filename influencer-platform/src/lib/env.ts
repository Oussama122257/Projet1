import { z } from "zod";

/**
 * Environment contract.
 *
 * Only DATABASE_URL and NEXTAUTH_SECRET are hard requirements — the platform
 * boots without Stripe or social credentials so the UI and seeded data are
 * explorable immediately. Each integration validates its own keys at call time
 * and fails loudly there instead of blocking startup.
 */
const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  NEXTAUTH_URL: z.string().url().default("http://localhost:3000"),
  NEXTAUTH_SECRET: z.string().min(1).default("dev-insecure-secret-change-me"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  ENCRYPTION_KEY: z.string().optional(),

  TIKTOK_CLIENT_KEY: z.string().optional(),
  TIKTOK_CLIENT_SECRET: z.string().optional(),
  TIKTOK_REDIRECT_URI: z
    .string()
    .default("http://localhost:3000/api/social/tiktok/callback"),

  INSTAGRAM_APP_ID: z.string().optional(),
  INSTAGRAM_APP_SECRET: z.string().optional(),
  INSTAGRAM_REDIRECT_URI: z
    .string()
    .default("http://localhost:3000/api/social/instagram/callback"),

  YOUTUBE_CLIENT_ID: z.string().optional(),
  YOUTUBE_CLIENT_SECRET: z.string().optional(),
  YOUTUBE_REDIRECT_URI: z
    .string()
    .default("http://localhost:3000/api/social/youtube/callback"),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_CONNECT_CLIENT_ID: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  CRON_ENABLED: z.string().default("true"),
  SYNC_CRON_SCHEDULE: z.string().default("0 * * * *"),
  CRON_SECRET: z.string().optional(),
  USE_MOCK_METRICS: z.string().default("true"),

  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;

export const flags = {
  useMockMetrics: env.USE_MOCK_METRICS !== "false",
  cronEnabled: env.CRON_ENABLED !== "false",
  stripeReady: Boolean(env.STRIPE_SECRET_KEY),
  tiktokReady: Boolean(env.TIKTOK_CLIENT_KEY && env.TIKTOK_CLIENT_SECRET),
  instagramReady: Boolean(env.INSTAGRAM_APP_ID && env.INSTAGRAM_APP_SECRET),
  youtubeReady: Boolean(env.YOUTUBE_CLIENT_ID && env.YOUTUBE_CLIENT_SECRET),
  googleAuthReady: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
};
