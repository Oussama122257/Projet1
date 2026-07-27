# ContentLoop

**An AI-powered content operating system.** ContentLoop ingests content from authorized source profiles, understands it with AI, scores and routes it through independent pipelines, schedules and publishes it via Metricool to the user's own destination profiles, measures real performance, and continuously learns from that performance to make better content decisions.

> ContentLoop is not an Instagram downloader. It answers three questions:
> 1. What content do I have?
> 2. What should I publish next?
> 3. Why is this content likely to perform well for **my** audience?

## The core loop

```
DISCOVER → INGEST → UNDERSTAND → SCORE → ROUTE → SCHEDULE → PUBLISH → MEASURE → LEARN → OPTIMIZE
```

## Stack

| Layer      | Technology |
|------------|------------|
| Frontend / API | Next.js 15 (App Router), TypeScript, Tailwind CSS, React Query, Zustand |
| Workers    | Node.js + BullMQ |
| Database   | PostgreSQL + Prisma (+ pgvector for embeddings) |
| Queue      | Redis + BullMQ |
| Storage    | Cloudflare R2 (S3-compatible) |
| Ingestion  | Apify (official API v2, configurable Actor) |
| Publishing | Metricool (official API — Advanced/Custom plan) |
| AI         | Anthropic Claude (primary), OpenAI, Google Gemini via a provider abstraction |
| Deployment | Docker (web + worker), managed Postgres/Redis |

## Repository layout

```
docs/        Architecture documentation (start at docs/README.md)
legal/       Acceptable Use Policy, Terms of Service
prisma/      Database schema and migrations
src/app/     Next.js App Router (pages + API route handlers)
src/components/  Design system + feature components
src/lib/     Domain services (apify, metricool, ai, queue, storage, auth, scoring)
src/workers/ Background workers (BullMQ processors)
```

## Running locally

```bash
cp .env.example .env        # fill in secrets
docker compose up -d postgres redis
npm install
npx prisma migrate dev
npm run dev                 # web on :3000
npm run worker:dev          # background workers (separate terminal)
```

## Compliance

ContentLoop only processes and publishes content the user owns or has explicit permission to reuse. It uses only official, authorized APIs (Apify API v2, Metricool API, Anthropic/OpenAI/Google APIs) and implements **no** mechanism to bypass authentication, private-account restrictions, CAPTCHAs, security controls, or rate limits. See [legal/ACCEPTABLE_USE_POLICY.md](legal/ACCEPTABLE_USE_POLICY.md) and [legal/TERMS_OF_SERVICE.md](legal/TERMS_OF_SERVICE.md).
