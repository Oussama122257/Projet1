import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  AUTH_SECRET: z.string().min(32),
  // Any high-entropy string >= 32 chars; the AES key is derived via SHA-256,
  // so auto-generated secrets (openssl rand, Render generateValue) work as-is.
  ENCRYPTION_KEY: z.string().min(32),
  APP_URL: z.string().url().default("http://localhost:3000"),

  APIFY_API_TOKEN: z.string().optional(),
  APIFY_ACTOR_ID: z.string().optional(),
  APIFY_INPUT_TEMPLATE: z.string().optional(),
  APIFY_WEBHOOK_SECRET: z.string().optional(),

  AI_PROVIDER: z.enum(["anthropic", "openai", "gemini"]).default("anthropic"),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  AI_MODEL_LIGHT: z.string().default("claude-haiku-4-5-20251001"),
  AI_MODEL_STANDARD: z.string().default("claude-sonnet-5"),
  AI_MODEL_DEEP: z.string().default("claude-opus-5"),
  AI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),

  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().default("contentloop-media"),
  R2_PUBLIC_BASE_URL: z.string().optional(),

  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/**
 * Zod-validated environment. Fails fast at boot with a readable message.
 * Server-side only — importing this from a client component is a build error
 * by convention (no NEXT_PUBLIC_ vars live here).
 */
export function env(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}
