# Instagram Repurposing SaaS — Roadmap & Setup Guide

A system that ingests a list of **source** Instagram accounts, scans them every hour,
scrapes new videos, stores them in **Google Drive**, and schedules them into
**Metricool** for publishing to your **destination** Instagram accounts — with
**Telegram** notifications and an **OpenClaw** control layer.

---

## 0. Read this first (risk & reality check)

Be honest with yourself about three things before building:

1. **Instagram ToS.** Scraping Instagram and auto-reposting violates Instagram's
   Terms of Use and its automated-collection rules. Accounts used for scraping or
   posting can be rate-limited, shadow-banned, or permanently disabled. Build with
   this risk priced in: use throwaway/burner scraper identities, residential proxies,
   and never scrape from an account you can't afford to lose.
2. **Copyright.** Re-uploading someone else's videos as your own can be copyright
   infringement and can get your destination accounts struck down. This is safest
   when you own the content, have permission, or are aggregating with credit under
   a model the source creators accept. Decide your content policy up front.
3. **"SaaS" vs "personal tool".** If this is only for *your own* accounts, you're
   building an internal automation. If you plan to sell it to other people (real
   SaaS), you inherit their legal exposure too, plus multi-tenancy, billing, and
   auth work. **Recommendation: build the personal tool first, harden it, then
   decide if it becomes a product.** This roadmap is structured so Phase 1–4 give
   you the personal tool and Phase 6 adds the SaaS layer only if you want it.

Nothing below is legal advice — talk to a lawyer before selling this.

---

## 1. High-level architecture

```
                         ┌─────────────────────────────────────────┐
                         │              CONTROL PLANE                │
                         │   OpenClaw (chat-driven ops) + Telegram   │
                         └───────────────┬───────────────────────────┘
                                         │ commands / alerts
                                         ▼
┌──────────────┐   every 1h   ┌───────────────────┐     ┌────────────────────┐
│  Scheduler   │─────────────▶│   Scraper Worker  │────▶│   Media Processor   │
│ (cron/queue) │              │ (per source acct) │     │ dedupe / transcode  │
└──────────────┘              └─────────┬─────────┘     └──────────┬─────────┘
                                        │ metadata               │ file
                                        ▼                         ▼
                              ┌───────────────────┐     ┌────────────────────┐
                              │     Database      │     │   Google Drive     │
                              │ Postgres (state)  │     │ (video storage)    │
                              └─────────┬─────────┘     └──────────┬─────────┘
                                        │                         │
                                        ▼                         ▼
                              ┌───────────────────────────────────────────────┐
                              │            Scheduler → Metricool API           │
                              │  create scheduled post per destination acct    │
                              └───────────────────────┬───────────────────────┘
                                                      ▼
                                            Instagram (via Metricool)
```

**Core components:**

| Component | Job | Suggested tech |
|---|---|---|
| API + Dashboard | manage source/destination accounts, rules, review queue | FastAPI (Python) or NestJS (Node) + React |
| Scheduler | fire "scan every 1h" jobs, retries, backoff | Celery Beat / BullMQ / APScheduler |
| Queue | decouple scan → scrape → process → schedule | Redis + Celery/BullMQ |
| Scraper worker | fetch new videos + metadata per source account | `yt-dlp` and/or `instaloader`, via rotating proxies |
| Media processor | dedupe (perceptual hash), transcode to Reel spec | `ffmpeg`, `imagehash` |
| Storage | hold downloaded videos | Google Drive API (service account) |
| Publisher | push scheduled posts | Metricool REST API |
| Notifier | status + approvals | Telegram Bot API |
| DB | accounts, jobs, dedupe hashes, post state | PostgreSQL |
| Control layer | chat-driven ops & alerts | OpenClaw |

**Recommended stack:** Python (FastAPI + Celery + Redis + Postgres). Python has the
best Instagram scraping and media tooling (`yt-dlp`, `instaloader`, `ffmpeg-python`).

---

## 2. Data model (minimum viable)

```
source_accounts      (id, username, proxy_group, last_scanned_at, is_active)
destination_accounts (id, username, metricool_brand_id, timezone, is_active)
routing_rules        (id, source_id, destination_id, active)      # who reposts whom
scraped_videos       (id, source_id, ig_shortcode, phash, drive_file_id,
                       caption, duration, status, created_at)
                       # status: scraped → processed → queued → scheduled → published → failed
scheduled_posts      (id, video_id, destination_id, metricool_post_id,
                       scheduled_at, status)
jobs                 (id, type, target_id, status, attempts, last_error, run_at)
```

`phash` (perceptual hash) is the dedupe key — never download or schedule the same
video twice, even if re-encoded.

---

## 3. Pipeline logic (the "every 1 hour" flow)

Each hourly tick, per active source account:

1. **Scan** — list recent posts (last N or since `last_scanned_at`). Filter to videos.
2. **Dedupe (cheap)** — skip any `ig_shortcode` already in `scraped_videos`.
3. **Download** — `yt-dlp`/`instaloader` through the account's proxy group.
4. **Dedupe (strong)** — compute perceptual hash; skip near-duplicates.
5. **Process** — transcode to Instagram Reels spec (9:16, ≤90s, H.264/AAC, ≤4GB).
6. **Store** — upload to Google Drive in `Source/<username>/` folder; save `drive_file_id`.
7. **Route & queue** — for each `routing_rule`, create a `scheduled_posts` row.
8. **Optional approval gate** — send Telegram card ("Approve / Skip / Edit caption").
9. **Schedule** — call Metricool API to create the scheduled post at the next open
   slot per destination account (respect a per-account posting calendar).
10. **Notify** — Telegram summary: "3 new videos scraped from @X, 2 scheduled to @Y."

**Rate discipline (critical to avoid bans):**
- Randomize the scan; don't hit every account at :00. Spread across the hour.
- Add jitter/delays between requests; use rotating **residential** proxies.
- One proxy group per small cluster of source accounts.
- Cap posts/day per destination account to look human (e.g. 1–4/day).

---

## 4. Integrations — how each one connects

### Google Drive
- Create a Google Cloud project → enable **Drive API** → create a **service account**
  → download JSON key.
- Share the target Drive folder with the service account's email (or use a Shared
  Drive so quota belongs to the org, not a personal 15 GB cap).
- Upload with the `google-api-python-client`; store returned `fileId`.
- Watch quota: video adds up fast — use a **Shared Drive** or Google Workspace.

### Metricool
- Requires an **Advanced plan or higher** for API access.
- Generate an API token: **Settings → API**. Send as `Authorization: Bearer <token>`.
- Each destination Instagram account = a **brand** in Metricool (you need its `blogId`/brand id).
- Create scheduled posts via the API with caption, media URL, platform, brand, and
  `publicationDate`. Videos sent to Instagram publish as **Reels**.
- Alternative/complement: **Autolists** — pre-built recycling lists per brand if you
  prefer Metricool to handle cadence instead of you computing slots.
- Media: Metricool needs a reachable media URL. Either make the Drive file
  temporarily shareable, or stage the file on your own object storage (S3/R2) and
  pass that URL. (R2/S3 staging is more reliable than Drive share links.)

> ⚠️ Metricool's API doesn't cover 100% of post types; Reels are supported but
> Stories/some configs are limited. Prototype the exact call early — this is the
> integration most likely to surprise you.

### Telegram (notifications + approvals)
- Create a bot via **@BotFather** → get the bot token.
- Get your chat id (message the bot, read `getUpdates`, or use a helper bot).
- Send messages via `https://api.telegram.org/bot<token>/sendMessage`.
- Use **inline keyboards** for Approve/Skip/Edit; handle callbacks with a webhook
  or long polling. `python-telegram-bot` handles both cleanly.
- Alerts to send: scrape failures, proxy bans, quota warnings, daily digest,
  approval requests, publish confirmations.

---

## 5. OpenClaw — the chat-driven control layer

OpenClaw is a self-hosted gateway that connects chat apps (Telegram, WhatsApp,
Slack, Discord…) to an AI agent that can run commands. Here you use it as a
**natural-language ops console** for the pipeline — "pause @account3", "how many
videos are queued for tomorrow?", "re-run the failed scrapes" — all from Telegram.

### Install (on your server)
```bash
# Requires Node 22.14+ (Node 24 recommended)
# One-liner installer (installs Node + OpenClaw):
curl -fsSL https://openclaw.ai/install.sh | bash    # verify current command at docs.openclaw.ai

# Guided setup wizard — configures gateway, workspace, channels, skills:
openclaw onboard
```
The wizard walks through: (1) gateway, (2) workspace, (3) provider/API key
(Anthropic key for Claude), (4) skills, (5) **Telegram** (paste your bot token).

### Wire it to your pipeline
Expose your pipeline operations as **skills/commands** OpenClaw can call — e.g. a
small CLI or HTTP endpoints on your API:
- `pipeline status` → counts by state
- `pause-source <username>` / `resume-source <username>`
- `retry-failed` → re-enqueue failed jobs
- `approve <video_id>` / `skip <video_id>`
- `add-source <username>` / `add-destination <username>`

Then from Telegram you literally chat with your SaaS. Keep OpenClaw's shell access
**scoped** — give it a wrapper CLI, not raw root, so a bad prompt can't wipe the box.

> Note: OpenClaw is your **operator/notifier interface**, not the scraping engine.
> The scraping/scheduling pipeline (Section 3) runs as its own always-on service;
> OpenClaw sits on top for control and alerts.

---

## 6. Hosting — server, domain, deployment

### Server
- Start with **one VPS**: 4 vCPU / 8 GB RAM / 80 GB SSD (Hetzner, DigitalOcean,
  Contabo). Ubuntu 22.04/24.04 LTS. `ffmpeg` transcoding is CPU-hungry — size up if
  you process lots of video.
- Add **rotating residential proxies** (a paid proxy provider). This is non-optional
  for Instagram scraping at scale — datacenter IPs get blocked fast.
- Optional object storage for media staging: **Cloudflare R2** (no egress fees) or S3.

### Deploy with Docker Compose
Run everything as containers:
```
services: api, worker (celery), beat (scheduler), redis, postgres,
          telegram-bot, openclaw, caddy (reverse proxy + TLS)
```
- **Caddy** or **Nginx** as reverse proxy; Caddy gives you automatic HTTPS.
- Keep secrets in a `.env` / secret manager, never in git.
- `docker compose up -d`, add healthchecks + `restart: unless-stopped`.

### Domain
1. Buy a domain (Namecheap, Cloudflare, Porkbun).
2. Point an **A record** to your VPS IP (e.g. `app.yourdomain.com`).
3. Caddy auto-provisions a Let's Encrypt cert — dashboard is now HTTPS.
4. Put Telegram webhooks + the dashboard behind the domain.

### Backups & monitoring
- Nightly `pg_dump` to R2/S3.
- Uptime + error alerts to the same Telegram channel (e.g. Uptime Kuma).
- Log aggregation (even just `docker logs` + Loki/Grafana later).

---

## 7. Phased roadmap (build order)

### Phase 0 — Foundations (week 1)
- [ ] Repo scaffold (FastAPI + Celery + Redis + Postgres, Docker Compose).
- [ ] Data model + migrations (Alembic).
- [ ] Secrets/config management, `.env`, logging.

### Phase 1 — Scrape & store (week 1–2)
- [ ] Scraper worker for **one** source account (`yt-dlp`/`instaloader`).
- [ ] Perceptual-hash dedupe.
- [ ] Google Drive upload (service account).
- [ ] Manual trigger; verify a real video lands in Drive.

### Phase 2 — Schedule & publish (week 2–3)
- [ ] Metricool API client: create one scheduled Reel to one destination brand.
- [ ] Media staging (R2/S3 URL for Metricool).
- [ ] Slot logic: next open slot per destination, daily caps.
- [ ] End-to-end test: source video → Drive → Metricool → published Reel.

### Phase 3 — Automate & notify (week 3–4)
- [ ] Celery Beat hourly scan with jitter + proxy rotation.
- [ ] Retries, backoff, failure states.
- [ ] Telegram bot: alerts + daily digest + Approve/Skip inline buttons.
- [ ] Routing rules (many sources → many destinations).

### Phase 4 — Control layer & hardening (week 4–5)
- [ ] OpenClaw on the server, Telegram channel, scoped ops CLI/skills.
- [ ] Minimal dashboard (accounts, review queue, job status).
- [ ] Domain + HTTPS + backups + uptime monitoring.
- [ ] Load test: run 5–10 source accounts for a week, watch for bans.

### Phase 5 — Scale (as needed)
- [ ] Proxy pools per source cluster; ban detection + auto-cooldown.
- [ ] Horizontal workers; per-account concurrency limits.
- [ ] Better dedupe/quality filters; caption templating.

### Phase 6 — Turn it into a real SaaS (optional)
- [ ] Multi-tenant auth (users, orgs), per-tenant isolation of accounts/proxies.
- [ ] Billing (Stripe), plan limits (accounts, posts/mo).
- [ ] Onboarding: connect *their* Metricool + Drive (OAuth, not shared keys).
- [ ] Terms of Service, content policy, abuse handling, GDPR/data deletion.
- [ ] Per-tenant Telegram/notification config.

---

## 8. Tech choices — quick recommendations

| Need | Pick | Why |
|---|---|---|
| Language | **Python** | best scraping + media ecosystem |
| API | **FastAPI** | async, fast, great DX |
| Queue/scheduler | **Celery + Redis + Celery Beat** | mature, hourly cron + retries |
| Scraping | **yt-dlp** (video) + **instaloader** (metadata) | robust, maintained |
| Media | **ffmpeg** | transcode to Reel spec |
| DB | **PostgreSQL** | relational state, JSON when needed |
| Storage | **Google Drive** (archive) + **R2/S3** (staging URLs) | Drive for you, R2 for Metricool |
| Notify/ops | **Telegram** + **OpenClaw** | alerts + chat control |
| Deploy | **Docker Compose + Caddy** on a **VPS** | simple, HTTPS, restartable |
| Proxies | **rotating residential** | avoid IG bans |

---

## 9. Biggest risks & how to blunt them

1. **Account bans** → burner scraper accounts, residential proxies, jitter, human-like
   posting caps, ban detection with auto-cooldown.
2. **Metricool API gaps** → prototype the exact Reel-scheduling call in Phase 2 before
   building around it; keep a manual-fallback path.
3. **Google Drive quota** → use a Shared Drive / Workspace; prune old files.
4. **Copyright strikes on destination accounts** → clear content policy; only repost
   what you're allowed to; keep source attribution.
5. **Cost creep** (proxies + Metricool Advanced + VPS + storage) → model monthly cost
   before scaling source-account count.

---

## 10. Next step

Pick one:
- **A.** I scaffold Phase 0 in this repo (FastAPI + Celery + Redis + Postgres + Docker
  Compose + data model) so you have a runnable skeleton.
- **B.** I build a single vertical slice first: scrape ONE account → Drive → one
  Metricool scheduled Reel, end to end, so you validate the risky integrations early.

**Recommended: B** — prove the Instagram-scrape and Metricool-publish integrations
work before investing in the full architecture. Everything else is plumbing around
those two risky edges.
