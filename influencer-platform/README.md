# PayLoop

**Influencer performance tracking with automated, fraud-checked payouts.**

Brands run campaigns priced on real performance. Creators connect their social
accounts once and get paid automatically. Every hour, PayLoop pulls fresh
metrics from the platform APIs, appends an immutable snapshot, recalculates
earnings, screens for fraudulent traffic, and transfers clean balances through
Stripe Connect.

```
CONNECT → APPLY → APPROVE → POST → MEASURE → SCREEN → PAY
                                      ↑____________|
                                      every hour
```

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend / API | Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion |
| Auth | NextAuth.js — email + password, Google optional |
| Database | PostgreSQL + Prisma |
| Charts | Recharts + hand-rolled SVG sparklines |
| Jobs | node-cron (MVP) — upgrade path to BullMQ + Redis documented in `src/jobs/runner.ts` |
| Payments | Stripe **Connect** — creators are third parties receiving transfers, not customers being charged |
| Social | TikTok Login Kit + Display API (live); Instagram Graph and YouTube Data v3 stubbed behind the same interface |

## Quick start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
#   Set DATABASE_URL, then generate the two secrets:
#     openssl rand -base64 32   → NEXTAUTH_SECRET
#     openssl rand -hex 32      → ENCRYPTION_KEY
#   Leave USE_MOCK_METRICS=true unless you have approved platform credentials.

# 3. Create the schema and load demo data
npm run db:migrate
npm run db:seed

# 4. Run
npm run dev          # app on http://localhost:3000
npm run dev:cron     # hourly sync worker, separate terminal
```

### Demo accounts

The seed creates a full working dataset — 3 brands, 8 creators, 5 campaigns,
~290 metric snapshots, 7 payouts and 5 fraud flags. Every account uses the
password `password123`.

| Role | Email | What to look at |
|------|-------|-----------------|
| Brand | `growth@atlasmobile.dz` | Campaign pipeline, per-creator performance table, budget consumption |
| Creator | `amine@creators.dz` | Animated earnings total, payout threshold progress, connected accounts |
| Admin | `admin@payloop.io` | Fraud queue with live evidence, platform analytics, user management |

## Architecture

```
src/
  app/
    (auth)/            login, register
    brand/             campaigns, applicant pipeline, spend
    influencer/        earnings, marketplace, connections, payouts
    admin/             fraud queue, analytics, users
    api/               REST endpoints (campaigns, applications, social, stripe, admin, cron)
  services/
    socialAuth.ts      OAuth handshakes; tokens encrypted before they touch the DB
    trackingService.ts per-platform fetchers normalised into one shape
    tracking/          tiktok.ts (live) · instagram.ts · youtube.ts (phase 2 stubs)
    paymentService.ts  earnings math + Stripe Connect transfers
    fraudDetection.ts  the rules, and the hold/release lifecycle
  jobs/
    syncMetrics.ts     the hourly pipeline
    runner.ts          node-cron scheduler process
  lib/                 db, auth, session, crypto, audit, api helpers
```

### Design decisions worth knowing

**Money is always integer cents.** No floats anywhere in the earnings path.
Rates are cents too — a CPM rate of `320` means $3.20 per 1,000 views — so the
whole calculation stays in integer space and rounds *down*, never up.

**Snapshots are append-only.** `ContentMetricSnapshot` is never updated. That
series is what the charts render, what the growth-trend fraud rule reads, and
what a payment dispute is settled against.

**Counters only move up.** Platforms occasionally report a lower number from a
stale cache. `mergeMetrics` takes the max of old and new so a blip can never
look like negative growth or claw back earnings.

**Budgets cannot be overdrawn.** Earnings are capped at the campaign's remaining
headroom *at calculation time*, not reconciled afterwards. A post going viral
past the budget simply stops accruing.

**Payouts are idempotent.** The `Payout` row and its idempotency key are created
*before* the Stripe call, keyed on the cumulative paid-out watermark. If the
process dies mid-transfer, the retry reuses the key and cannot double-pay.

**Tokens are encrypted at rest.** AES-256-GCM via `ENCRYPTION_KEY`, in a
versioned envelope (`v1.<iv>.<tag>.<payload>`) so the algorithm can be rotated
later. Rotating the key invalidates stored tokens and forces a reconnect —
that's deliberate.

## The hourly job

For every approved application on an active campaign:

1. Fetch fresh metrics from the platform.
2. Append a `ContentMetricSnapshot`.
3. Recalculate earnings, capped by remaining campaign budget.
4. Run fraud detection. **A flag holds the payout and stops here.**
5. If the unpaid balance clears `minPayoutThresholdCents` and the creator's
   Stripe account is verified, transfer via Connect.

Every transition writes an `AuditEvent`. Failures are collected per application
rather than thrown — one creator's expired token must never stop the payout run
for everyone else.

### Running it

**Locally:** `npm run dev:cron` starts the node-cron scheduler in its own
process. Set `RUN_ON_START=true` to fire once immediately instead of waiting for
the top of the hour.

**In production, pick one:**

- *Always-on worker* — run `npm run worker` as a separate service
  (Railway, Render, Fly). Keep `CRON_ENABLED=true`.
- *Vercel Cron* — set `CRON_ENABLED=false` and let the platform hit
  `POST /api/cron/sync` hourly. `vercel.json` already declares the schedule; the
  endpoint authenticates with `CRON_SECRET` in constant time and refuses to run
  without it.

Do **not** run both — node-cron has no distributed lock, so two schedulers would
both fire. That's the main reason to move to BullMQ once there's more than one
worker.

## Fraud rules

Thresholds live as named constants in `src/services/fraudDetection.ts`.

| Rule | Fires when |
|------|-----------|
| `LOW_ENGAGEMENT_RATIO` | > 10,000 views with < 10 clicks |
| `GEO_CONCENTRATION` | one region holds > 70% of a multi-region audience |
| `SPIKE_ANOMALY` | > 500% hour-over-hour view growth sustained across 3+ snapshots |
| `CLICK_VIEW_ANOMALY` | click-through rate above 35% |

A flagged application moves to `HELD_FOR_REVIEW` and is excluded from the payout
run until an admin clears it. Re-flagging is deduplicated per `(application,
reason)` while a flag is open, so an hourly cron can't pile up 24 identical rows
a day. Clearing the *last* open flag returns the application to the queue.

The rules are deliberately conservative about virality: a single spike is not
flagged, because real content does that. Only a sustained run is.

## Platform integrations

TikTok is fully implemented — it's the launch market. Instagram and YouTube are
stubs behind the same `PlatformFetcher` interface, with the exact API calls
sketched in comments so wiring them up is filling in a `fetch`, not reshaping
the sync job.

With `USE_MOCK_METRICS=true` (the default), all three return deterministic
simulated metrics seeded from the content id, so charts stay stable across
restarts and the UI is fully explorable without approved developer credentials.

## Commands

```bash
npm run dev          # dev server
npm run dev:cron     # cron worker with watch
npm run build        # production build
npm run start        # production server
npm run worker       # cron worker (production)

npm run test         # fraud rules + earnings math
npm run typecheck    # tsc --noEmit
npm run lint         # next lint

npm run db:migrate   # create/apply a migration
npm run db:deploy    # apply migrations (production)
npm run db:seed      # reset and load demo data
npm run db:studio    # Prisma Studio
npm run db:reset     # drop, re-migrate, reseed
```

## Deployment

**Vercel + managed Postgres** (Supabase, Neon, Railway):

1. Set every variable from `.env.example` in the project settings.
2. Build command is `prisma generate && next build`; run `npm run db:deploy`
   against the production database before the first deploy.
3. Set `CRON_ENABLED=false` and `CRON_SECRET` — `vercel.json` schedules
   `/api/cron/sync` hourly.
4. Point a Stripe webhook at `/api/stripe/webhook` for `account.updated` and
   `transfer.reversed`, and set `STRIPE_WEBHOOK_SECRET`.

**Docker:** `docker compose up -d --build` boots Postgres, the web app and the
worker together. Migrations and the seed run automatically on first start.

## What is not built

Stated plainly so nothing here is mistaken for finished:

- **Instagram and YouTube tracking** are stubs. They return mock data and throw
  a typed `NOT_IMPLEMENTED` error in live mode.
- **Click attribution** assumes the platform reports clicks or that a redirect
  layer supplies them. The redirect service itself isn't built — `syncMetrics`
  takes whichever source knows more.
- **Payout currency** is USD only. `User.country` is stored but no FX or
  local-rail routing exists.
- **Google sign-in** is wired but inactive until `GOOGLE_CLIENT_ID/SECRET` are
  set.
- **Tests** cover the fraud rules and earnings math — the paths where being
  wrong costs money. There is no browser-level or API-level test suite.
