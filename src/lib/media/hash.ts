import { createHash } from "crypto";

/** SHA-256 content hash used for global media deduplication. */
export function contentHash(buffer: Buffer | Uint8Array): string {
  return createHash("sha256").update(buffer).digest("hex");
}
