# 10. Security & Privacy Model

## Security model

**Authentication & sessions**
- bcrypt password hashing (cost 12), HTTP-only Secure SameSite=Lax JWT cookie (jose, HS256 with `AUTH_SECRET`), 7-day expiry with rotation. Middleware guards all `(app)` pages and `/api/*` except auth/health/webhook.

**Authorization**
- Every query is scoped by the session's `userId`. Resource handlers load-and-verify ownership (`source.userId === session.userId`) before acting; cross-tenant access is structurally impossible through the API layer.
- AI assistant tools receive `userId` from the server session only — never from model output.

**Secrets**
- `APIFY_API_TOKEN`, AI provider keys, `AUTH_SECRET`, `ENCRYPTION_KEY`, DB/Redis URLs: server-side env only, zod-validated at boot, never sent to the client, never logged, never included in AI prompts.
- Metricool `userToken` is encrypted at rest (AES-256-GCM with `ENCRYPTION_KEY`) and decrypted only inside the publisher/sync workers and connection-test handler.

**Input & injection defenses**
- All request bodies zod-validated. Prisma parameterized queries only — no string SQL, and categorically no LLM-generated SQL.
- Content originating from scraped captions/comments is treated as untrusted when embedded in AI prompts: wrapped in delimited data blocks with instructions that it is data, not instructions (prompt-injection mitigation), and never given tool-triggering authority.
- Apify webhook verified by shared secret; all webhooks are idempotent.

**Rate limiting & abuse**
- Redis token buckets per user on AI endpoints, scan triggers and auth attempts. Plan quotas via `usage_records`.
- The platform contains no functionality to bypass authentication, private accounts, CAPTCHA, security controls, or platform rate limits — ingestion goes exclusively through the official Apify API, publishing exclusively through the official Metricool API.

**Transport & infrastructure**
- TLS everywhere; R2 access via short-lived pre-signed URLs; containers run as non-root; least-privilege DB user; dependency audit in CI.

## Privacy model

- **AI Data Settings** (per user, enforced in workers before any provider call):
  - Allow AI content analysis
  - Allow performance-data analysis
  - Allow AI captions
  - Allow AI recommendations
- **Data minimization to AI providers:** only derived signals (frames, transcript, caption, aggregates) — never tokens, credentials, emails, or full DB rows. Provider + model recorded per call (`ai_usage`) so users can see exactly what class of data went where.
- **Transparency page** in Settings lists which providers are configured and what data categories each feature sends.
- **Retention:** media deleted by users is removed from R2 by `storage-cleanup`; performance data retained per plan policy; audit logs immutable.
- **Ownership attestation:** sources cannot be scanned until the user confirms they own or have explicit permission to reuse the content (`authorizationConfirmedAt`). The platform never asserts user ownership of third-party content and surfaces this responsibility in the AUP/ToS and in the source-creation UI.
