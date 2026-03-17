# Trustpilot Outreach Agent

Full-stack platform for scraping leads from Trustpilot and running personalized email outreach campaigns.

## Architecture

```
├── backend/
│   ├── server.js          # Express API (10 endpoints + SSE streaming)
│   ├── scraper.js         # Trustpilot scraper (Cheerio-based)
│   ├── emailService.js    # SMTP email service (Nodemailer)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.js         # Main app with 5-stage pipeline
│   │   ├── App.css        # Dark theme styles
│   │   └── components/
│   │       ├── ProgressTracker.js
│   │       ├── ConfigureStage.js
│   │       ├── ScanStage.js
│   │       ├── ReviewStage.js
│   │       ├── PreviewSendStage.js
│   │       └── DoneStage.js
│   └── package.json
├── Dockerfile
├── .env.example
└── .gitignore
```

## Pipeline Stages

1. **Configure** — Filter by category, search query, rating range (target low-rated businesses)
2. **Scan** — Real-time scanning with SSE progress streaming, discovers businesses and extracts emails
3. **Review & Export** — Data table with select/deselect, CSV export
4. **Preview & Send** — Personalized HTML email preview, SMTP config, batch send
5. **Done** — Campaign summary with expected open/reply rates

## Quick Start (Local Development)

```bash
# 1. Install backend dependencies
cd backend && npm install

# 2. Create .env file
cp ../.env.example .env
# Edit .env with your SMTP credentials

# 3. Start backend
npm start
# Server runs on http://localhost:3001

# 4. In another terminal, install and start frontend
cd frontend && npm install && npm start
# Frontend runs on http://localhost:3000 (proxies API to 3001)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/categories` | List Trustpilot categories |
| POST | `/api/scan` | Start a scan (returns scanId) |
| GET | `/api/scan/:scanId/stream` | SSE stream for scan progress |
| GET | `/api/scan/:scanId` | Get scan status/results |
| GET | `/api/search?q=&category=&minRating=&maxRating=` | Quick search |
| GET | `/api/business/:domain` | Scrape single business profile |
| GET | `/api/emails/:domain` | Extract emails from a domain |
| POST | `/api/email/preview` | Preview email template |
| POST | `/api/email/send` | Send batch emails |
| POST | `/api/export/csv` | Export leads as CSV |

## Environment Variables

```
PORT=3001
CORS_ORIGIN=*
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SENDER_NAME=Your Name
SENDER_COMPANY=Your Company
```

## Gmail SMTP Setup

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification**
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Generate a new app password for "Mail"
5. Use the 16-character password as `SMTP_PASS`

## Deploy to Railway (5 minutes)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Set environment variables
railway variables set SMTP_HOST=smtp.gmail.com
railway variables set SMTP_PORT=587
railway variables set SMTP_USER=you@gmail.com
railway variables set SMTP_PASS=your-app-password
railway variables set SENDER_NAME="Your Name"
railway variables set SENDER_COMPANY="Your Company"

# Get your live URL
railway domain
```

## Deploy with Docker

```bash
# Build frontend first
cd frontend && npm install && npm run build && cd ..

# Build and run Docker image
docker build -t trustpilot-agent .
docker run -p 3001:3001 --env-file .env trustpilot-agent
```

## Other Hosting Options

- **Render** (free tier) — Connect GitHub repo, auto-deploys
- **DigitalOcean App Platform** — $5/mo, managed hosting
- **VPS (Hetzner/DigitalOcean)** — $4-6/mo, full control with Nginx + SSL
- **AWS/GCP** — For enterprise scale

## Email Sending Limits

| Provider | Free Tier | Cost at Scale |
|----------|-----------|---------------|
| Gmail SMTP | 500/day | Free |
| SendGrid | 100/day free | $0.10/1K emails |
| Amazon SES | 200/day free | $0.10/1K emails |
| Mailgun | 100/day free | $0.80/1K emails |

## Tech Stack

- **Backend**: Node.js, Express, Cheerio, Nodemailer, Axios
- **Frontend**: React 18
- **Scraping**: Cheerio (HTML parsing), Axios (HTTP)
- **Email**: Nodemailer with SMTP
- **Streaming**: Server-Sent Events (SSE)
