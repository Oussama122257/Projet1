# 13. Hosting on Vercel (operational setup)

## What Vercel can and cannot run

Vercel runs the **Next.js app** (dashboard + all `/api` routes) as serverless/edge functions. It **cannot** run the BullMQ worker fleet — scans, downloads, AI analysis, scheduling, publishing and performance sync are long-running background processes, and Vercel functions are short-lived by design.

So the operational Vercel topology is a split:

```
Vercel (web + API)  ──┐
                      ├──►  Neon Postgres (pgvector)   ◄──┐
Worker service ───────┘                                    │
(Railway / Render /   ────►  Redis (Railway/Render/       │
 Fly / any Docker host)      Redis Cloud / Upstash)  ──────┘
                      ────►  Cloudflare R2
```

Web and workers share the same `DATABASE_URL`, `REDIS_URL` and secrets. The API enqueues jobs into Redis; the worker service processes them. Everything stays cloud-only — no local machine required.

## Step-by-step

### 1. Database — Neon (Postgres + pgvector)
1. Create a Neon project (directly or via Vercel Marketplace → Storage → Neon).
2. Copy **both** connection strings:
   - pooled (pgbouncer) → `DATABASE_URL`
   - unpooled/direct → `DIRECT_DATABASE_URL` (migrations need this; the schema's `directUrl` is already wired).
3. pgvector is supported on Neon; the initial migration runs `CREATE EXTENSION IF NOT EXISTS "vector"` automatically.

### 2. Redis
Any Redis reachable over TLS from both Vercel and the worker host:
- **Railway / Render Key Value / Redis Cloud** — plain Redis, works with BullMQ out of the box (recommended).
- **Upstash** — works with BullMQ, but note its per-command pricing: BullMQ polls, so prefer a fixed-price Redis for workers.

Use the `rediss://…` URL as `REDIS_URL` in **both** places.

### 3. Vercel project (web)
1. Vercel → **Add New → Project** → import `Oussama122257/Projet1`.
2. Framework is auto-detected (Next.js). `vercel.json` already sets the build to `prisma generate && prisma migrate deploy && next build` — migrations apply on every deploy.
3. Set Environment Variables (Production):
   - `DATABASE_URL` (Neon pooled), `DIRECT_DATABASE_URL` (Neon direct)
   - `REDIS_URL`
   - `AUTH_SECRET`, `ENCRYPTION_KEY` (32+ char random strings — `openssl rand -hex 32`; **must be identical on the worker service**)
   - `APP_URL` = `https://<your-project>.vercel.app`
   - Optional now, required for features: `APIFY_API_TOKEN`, `APIFY_ACTOR_ID`, `APIFY_WEBHOOK_SECRET`, `ANTHROPIC_API_KEY` (and/or `OPENAI_API_KEY`, `GEMINI_API_KEY`), `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`
4. Deploy. `/api/health` should return `{"ok":true}`.
5. `vercel.json` pins functions to `fra1` — change the region to sit next to your database.

### 4. Worker service (the always-on part)
Deploy the same repo as a Docker service using **`Dockerfile.worker`** on Railway, Render, Fly.io, or any Docker host:
- Render: New → Background Worker → this repo → Docker → `Dockerfile.worker` (or reuse the `render.yaml` blueprint and skip its web service).
- Railway: New service → GitHub repo → set Dockerfile path to `Dockerfile.worker`.

Give it the **same env vars** as Vercel (`DATABASE_URL`, `DIRECT_DATABASE_URL`, `REDIS_URL`, `AUTH_SECRET`, `ENCRYPTION_KEY`, Apify/AI/R2 keys). The worker self-migrates on boot and registers the cron sweeps (source scans every 5 min, schedule filling every 5 min).

### 5. Wire the outside world
- **Apify webhook** (optional but recommended): point it at `https://<your-app>.vercel.app/api/integrations/apify/webhook?secret=<APIFY_WEBHOOK_SECRET>` for instant run completion instead of polling.
- **Metricool**: connect in-app (Integrations page) with your Advanced/Custom-plan token.

### 6. Verify operational status
1. `GET /api/health` → ok.
2. Register, add a source (with the rights attestation), click **Scan now**.
3. Watch `/jobs`: `source_scan` → `apify_run` → `media_download` → `ai_analysis` progressing means Vercel⇄Redis⇄worker⇄Postgres are all wired correctly.
4. Worker logs show `contentloop worker fleet started`.

## Notes & gotchas

- **Serverless Postgres connections**: always use Neon's *pooled* URL for `DATABASE_URL` on Vercel, or connection counts will exhaust under load.
- **Function duration**: API routes only enqueue and read — nothing long-running happens inside Vercel functions (30s cap configured; typical calls are <1s).
- **Two deploys, one repo**: pushing to the branch redeploys Vercel automatically; enable auto-deploy on the worker host so both stay in sync (schema drift between web and worker is the main operational risk).
- **Same secrets everywhere**: if `ENCRYPTION_KEY` differs between Vercel and the worker, the worker cannot decrypt Metricool tokens saved via the web app.
- **Simpler alternative**: if you'd rather run one platform, the `render.yaml` blueprint hosts web + workers together in one click (see README) — Vercel is a great fit specifically when you want its edge network/preview deployments for the dashboard.
