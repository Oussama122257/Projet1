# Threads Scraper Bot - Local SaaS

A full-featured web application for scraping Threads profiles, generating AI content, posting to Threads, exporting to CSV, and sending Telegram notifications.

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 3. Run the server
python run.py
```

Open **http://localhost:8000** - register an account and start scraping.

## Docker

```bash
cp .env.example .env
docker compose up -d
```

## Features

- **Auth System** - Register/login with secure password hashing
- **Threads Scraper** - Scrape any profile's posts via RapidAPI (likes, replies, dates)
- **AI Content Generator** - Generate posts using Claude, GPT-4o, or Gemini
- **Threads Publisher** - Post AI-generated content directly to Threads
- **CSV Export** - Download scraped data and AI content as CSV
- **Telegram Notifications** - Get notified on scrape/generate/post events
- **Dashboard** - Stats overview, job history, quick actions
- **Per-User Settings** - Each user configures their own API keys

## Pages

| Route | Description |
|---|---|
| `/dashboard` | Stats overview + quick scrape |
| `/api/scraper` | Scrape profiles, view job history |
| `/api/scraper/job/{id}` | Job detail: profile, posts, AI, export |
| `/api/generate` | AI content generation from scrape jobs |
| `/api/settings` | Configure API keys per user |

## API Keys Needed

| Service | Purpose | Where to get |
|---|---|---|
| RapidAPI | Threads scraping | rapidapi.com |
| Anthropic / OpenAI / Gemini | AI generation | respective provider sites |
| Meta Threads API | Posting | developers.facebook.com/docs/threads |
| Telegram Bot | Notifications | @BotFather on Telegram |

## Tech Stack

- **Backend**: FastAPI + SQLAlchemy + SQLite
- **Frontend**: Jinja2 + Tailwind CSS
- **Auth**: JWT (cookie-based) + bcrypt
- **Jobs**: FastAPI BackgroundTasks
