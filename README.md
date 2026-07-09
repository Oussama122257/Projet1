# Reelay — Instagram video repurposing pipeline

Ingest **source** Instagram accounts, scan them every hour, download new videos,
store them in **Google Drive**, schedule them into **Metricool** for publishing to
your **destination** Instagram accounts — with **Telegram** alerts and approvals.

> ⚠️ Scraping Instagram and reposting others' videos violates Instagram's Terms of
> Use and can raise copyright issues. Use burner scraper accounts + rotating
> residential proxies, set a clear content policy, and read `ROADMAP.md` §0.

## What's here

| Path | What it is |
|---|---|
| `backend/` | FastAPI API + Celery pipeline (scan → download → Drive → Metricool) + `reelayctl` CLI |
| `frontend/` | Reelay dashboard (static, fetches the API; demo data fallback) |
| `openclaw/` | Chat-driven control layer — run the pipeline from Telegram (see `openclaw/README.md`) |
| `docker-compose.yml` | api, worker, beat, redis, postgres, frontend, openclaw (opt-in profile) |
| `ROADMAP.md` | architecture, hosting, phased build order, risks |
| `design/` | UI mockup + UI/UX spec |

## Architecture

```
Beat (hourly) → enqueue_scans → scan_source (per account, jittered)
   → download_and_store (yt-dlp + perceptual-hash dedupe → Google Drive)
   → Telegram approval card → schedule_video → Metricool (Reels)
   → reconcile_published → Telegram digest
```

Pipeline states: `scraped → processed → queued → scheduled → published` (or
`failed` / `skipped`). See `backend/app/models.py`.

## Run it locally

```bash
cp .env.example .env          # fill in tokens as you get them (works empty for a demo)
mkdir -p secrets              # put gdrive.json here when ready
docker compose up --build
```

- API:       http://localhost:8000  (docs at `/docs`)
- Dashboard: http://localhost:8080  (includes the OpenClaw Assistant panel)
- Health:    http://localhost:8000/health

Add the chat control layer with `docker compose --profile openclaw up` and then
message your Telegram bot "status". Details in `openclaw/README.md`.

The dashboard shows **demo data** until the API has real accounts, then flips to
**live**. Add accounts via the API:

```bash
# a destination (your publishing account) — needs its Metricool brand id
curl -X POST localhost:8000/api/destinations \
  -H 'content-type: application/json' \
  -d '{"username":"my.travel.page","metricool_brand_id":"BRAND_ID","daily_cap":3}'

# a source (to scrape), routed to that destination
curl -X POST localhost:8000/api/sources \
  -H 'content-type: application/json' \
  -d '{"username":"travel.hues","proxy_group":"eu-res-01","destination_ids":[1]}'
```

## Credentials you'll need

| Integration | How to get it | Env var |
|---|---|---|
| Google Drive | Cloud project → Drive API → service account JSON → share a Shared Drive with it | `GOOGLE_SERVICE_ACCOUNT_FILE`, `GDRIVE_ROOT_FOLDER_ID` |
| Metricool | Advanced plan → Settings → API token; each dest = a "brand" | `METRICOOL_API_TOKEN`, `METRICOOL_USER_ID` |
| Telegram | @BotFather bot token + your chat id | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` |
| Proxies | rotating **residential** proxy provider | `PROXY_<GROUP>` (e.g. `PROXY_EU_RES_01`) |
| Media staging | Cloudflare R2 / S3 public base URL (Metricool needs a reachable URL) | `MEDIA_PUBLIC_BASE_URL` |

## Hosting, Telegram & OpenClaw

See `ROADMAP.md` §5–6: VPS + Docker Compose + Caddy (auto-HTTPS), domain A-record,
backups, and OpenClaw as a chat-driven ops console on top of the pipeline.

## Status

Scaffold is runnable: API verified end-to-end (accounts, routing, dashboard
aggregation). Scraper / Drive / Metricool / Telegram are implemented against their
real APIs — plug in credentials and a proxy to go live. Confirm the exact Metricool
Reel-scheduling payload against their current API PDF before production.
