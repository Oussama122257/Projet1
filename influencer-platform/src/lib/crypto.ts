import crypto from "node:crypto";
import { env } from "./env";

/**
 * AES-256-GCM envelope for social OAuth tokens.
 *
 * Tokens are the keys to a creator's account — they are never written to the
 * database in plaintext, never logged, and never returned to the client. The
 * ciphertext format is `v1.<iv>.<authTag>.<payload>`, all base64url, so the
 * version prefix leaves room to rotate algorithms later without a data migration
 * guessing game.
 */

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // 96-bit nonce, the GCM standard
const VERSION = "v1";

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;

  const raw = env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "ENCRYPTION_KEY is not set. Generate one with `openssl rand -hex 32` — " +
        "social tokens cannot be stored without it."
    );
  }

  // Accept hex (preferred, 64 chars) or base64; reject anything that doesn't
  // decode to exactly 32 bytes rather than silently padding a weak key.
  let key: Buffer;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    key = Buffer.from(raw, "hex");
  } else {
    key = Buffer.from(raw, "base64");
  }

  if (key.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY must decode to 32 bytes (got ${key.length}). ` +
        "Use `openssl rand -hex 32`."
    );
  }

  cachedKey = key;
  return key;
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decrypt(payload: string): string {
  const parts = payload.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error("Malformed ciphertext: unrecognised envelope format");
  }
  const [, ivB64, tagB64, dataB64] = parts;

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivB64, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

/** Encrypt a JSON-serialisable value. */
export function encryptJson(value: unknown): string {
  return encrypt(JSON.stringify(value));
}

/** Decrypt into a typed value; returns null if the payload can't be read. */
export function decryptJson<T>(payload: string): T | null {
  try {
    return JSON.parse(decrypt(payload)) as T;
  } catch {
    // A key rotation or corrupted row shouldn't take down a whole request —
    // callers treat null as "not connected" and prompt a reconnect.
    return null;
  }
}

/** Constant-time comparison for webhook/cron shared secrets. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Opaque random token for OAuth `state` values. */
export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}
