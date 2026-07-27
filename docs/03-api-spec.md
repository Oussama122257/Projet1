# 3. API Specification

All endpoints are Next.js Route Handlers under `/api`. JSON in/out. Zod-validated bodies. Session cookie auth (HTTP-only JWT). Every handler resolves the authenticated user first and scopes all queries by `userId`; pipeline/source/media IDs are always checked for ownership.

Error envelope: `{ "error": { "code": string, "message": string } }` with proper HTTP status (400 validation, 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict, 429 rate limited).

## Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | `{email, password, name}` → creates user, sets session cookie |
| POST | `/api/auth/login` | `{email, password}` → session cookie |
| POST | `/api/auth/logout` | clears session |
| GET  | `/api/auth/me` | current user profile + plan + consent flags |

## Sources
| Method | Path | Description |
|---|---|---|
| GET | `/api/sources` | list user sources (+ scan stats, pipeline usage) |
| POST | `/api/sources` | create `{name, url, platform, monitoringFrequency, authorizationConfirmed: true}` — creation **requires** the authorization attestation |
| GET/PATCH/DELETE | `/api/sources/:id` | read / update / archive |
| POST | `/api/sources/:id/scan` | enqueue a scan (409 if a run is already active) → `{jobId, runRecordId}` |

## Pipelines
| Method | Path | Description |
|---|---|---|
| GET | `/api/pipelines` | list with health summary |
| POST | `/api/pipelines` | create `{name, goal, timezone, sourceIds[], aiSettings, diversityRules}` |
| GET/PATCH/DELETE | `/api/pipelines/:id` | read / update (incl. autopilot mode, AI toggles) / archive |
| GET | `/api/pipelines/:id/pool` | ranked content pool (pipeline_media join media + analysis) |
| POST | `/api/pipelines/:id/schedule` | upsert schedule + slots |

## Content
| Method | Path | Description |
|---|---|---|
| GET | `/api/content` | global media library; filters: source, pipeline, status, sort (aiScore, newest, performance); cursor pagination |
| GET | `/api/content/:id` | media detail + AI analysis + similar top performers |
| POST | `/api/content/:id/analyze` | enqueue AI (re-)analysis (no-op if fresh analysis exists — cache) |
| POST | `/api/content/:id/assign` | `{pipelineId}` add to a pipeline pool |

## Calendar & scheduling
| Method | Path | Description |
|---|---|---|
| GET | `/api/calendar` | scheduled posts in range, per pipeline/destination |
| POST | `/api/calendar/posts` | manually schedule `{mediaId, pipelineId, publishAt, caption?}` |
| PATCH/DELETE | `/api/calendar/posts/:id` | reschedule / cancel (only before SENT_TO_METRICOOL) |

## Analytics
| Method | Path | Description |
|---|---|---|
| GET | `/api/analytics/overview` | totals, engagement rate, best/worst post, follower growth, trend |
| GET | `/api/analytics/top-content` | top N with filters (pipeline, destination, date, type, source, format) |
| GET | `/api/analytics/heatmap` | posting-time × day performance matrix (computed from post_performance) |
| GET | `/api/analytics/sources` | per-source performance ranking |

## Experiments
| Method | Path | Description |
|---|---|---|
| GET/POST | `/api/experiments` | list / create (validated design — see 08) |
| GET/PATCH | `/api/experiments/:id` | detail incl. variant results / start, stop |
| POST | `/api/experiments/:id/analyze` | enqueue AI analysis of results |

## AI
| Method | Path | Description |
|---|---|---|
| POST | `/api/ai/analyze` | enqueue analysis for media batch |
| GET | `/api/ai/recommendations` | today's recommendations (reason, data source, confidence, expected impact) |
| POST | `/api/ai/chat` | assistant conversation; server-side tool loop (see 06) |
| GET | `/api/ai/insights` | stored ai_insights, filterable by type/pipeline |
| POST | `/api/ai/captions` | generate caption+hashtags for `{mediaId, pipelineId}` honoring brand voice |
| GET/PUT | `/api/ai/brand-voice` | brand profile per pipeline |

## Integrations
| Method | Path | Description |
|---|---|---|
| GET | `/api/integrations/metricool` | connection status + brands (simpleProfiles) |
| POST | `/api/integrations/metricool` | save `{userToken, userId}` (validated by a live simpleProfiles call), token encrypted at rest |
| DELETE | `/api/integrations/metricool` | disconnect |
| GET | `/api/integrations/apify` | actor config status (token presence only — never the token) |
| POST | `/api/integrations/apify/webhook` | Apify webhook receiver (HMAC-verified) for run termination events |

## Ops
| Method | Path | Description |
|---|---|---|
| GET | `/api/jobs` | recent jobs with status/attempts/errors |
| GET | `/api/logs` | recent application logs (user-scoped) |
| GET | `/api/health` | liveness (db + redis ping) |

## Approvals (assisted autopilot)
| Method | Path | Description |
|---|---|---|
| GET | `/api/approvals` | pending AI-proposed items (content picks, captions, schedules, experiments) |
| POST | `/api/approvals/:id` | `{action: approve|reject|edit, payload?}` — writes ai_audit_logs |

## Rate limiting & quotas
Per-user token bucket on AI endpoints and scan triggers (Redis). Plan quotas enforced in handlers via `usage_records` before enqueueing work.
