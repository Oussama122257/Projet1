# 12. MVP Roadmap

Phased delivery; each phase ends with a report (implemented, files, migrations, env vars, run/test instructions, limitations, next).

## Phase 1 — Foundation ✅ (this repository state)
Repo scaffold, full Prisma schema, auth (register/login/session), design-system shell + all app routes, Apify client/services (real API v2), Metricool client (official endpoints), AI provider abstraction (Anthropic implemented; OpenAI/Gemini adapters; model routing; usage tracking), R2 storage client, BullMQ queues + 7 core workers wired end-to-end at the structural level, sources & pipelines CRUD, jobs observability, docker-compose, legal docs.

## Phase 2 — Ingestion vertical slice
Run real Apify scans end-to-end: webhook receiver, dataset normalization against the operator's chosen Actor, media download → R2, dedupe, content pool fan-out, media grid UI with live job status (SSE). Integration tests with recorded Apify fixtures.

## Phase 3 — AI understanding
media-processing (FFmpeg keyframes/audio), transcription + OCR, Claude structured analysis + scoring with caching, embeddings + pgvector similarity, content detail page with explainable scores.

## Phase 4 — Publishing vertical slice
Schedules & slots UI, pipeline-scheduler selection with diversity rules, caption/hashtag generation with brand voice, approval center (ASSISTED), Metricool publish + status tracking, calendar UI.

## Phase 5 — Analytics & learning
performance-sync snapshot chain, analytics dashboards + heatmap + top content, winner detection, ai-insights aggregates → Claude interpretation, content intelligence profiles feeding the ranker, "What works" page, daily recommendations.

## Phase 6 — Experiments
Experiment designer + guards, variant tagging through scheduling, results aggregation + stats tests, AI proposal/interpretation, experiment UI.

## Phase 7 — Assistant & autopilot
AI chat with the controlled tool layer, AUTO mode with safety gates, audit log UI, weekly/monthly strategy reports, weekly plan generator.

## Phase 8 — Productionization
Billing/plan enforcement, onboarding wizard, notifications, rate-limit hardening, e2e + load tests, deployment manifests, observability dashboards, security review.

## Testing strategy (across phases)
Unit: normalizers, dedupe, scoring, stats. Integration: API handlers (authz matrix), Apify/Metricool clients against fixtures, queue flows with test Redis. E2E: Playwright on the golden path. Edge cases tracked as a living checklist (multi-pipeline sources, run failures, schema drift, expired connections, provider outages/limits, empty pools, paused entities, insufficient samples).
