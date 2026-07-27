# 5. Metricool Integration

Grounded in the **official Metricool API** (Metricool "Metricool API" doc, Technical Support Dept., 2024; swagger at `https://app.metricool.com/resources/apidocs/index.html`). API access requires a Metricool **Advanced or Custom plan** token.

## Facts from official documentation

- Base URL: `https://app.metricool.com/api`
- Auth: header `X-Mc-Auth: <userToken>` (from Account Settings → API) on every call, plus `userId` and `blogId` request parameters on all endpoints. A "blog" is a Metricool **brand**.
- List brands: `GET /admin/simpleProfiles?userId=...&blogId=...`
- Create scheduled post: `POST /v2/scheduler/posts` — body includes `publicationDate {dateTime, timezone}`, `text`, `providers [{network: "instagram" | "facebook" | ...}]`, `autoPublish`, `draft`, per-network data objects (e.g. `instagramData {autoPublish}`), `media` URLs.
- Media must first be normalized: `GET /actions/normalize/image/url?url=<public media url>` → returns a Metricool-hosted copy URL to use in the post's media field. Media URLs must be publicly accessible and the user must hold rights to them (we pass **pre-signed R2 URLs** of media the user has attested rights to).
- Analytics: `GET /stats/timeline/{metric}?start&end` (e.g. `igFollowers`) and `GET /v2/analytics/reels/instagram?from&to` for Instagram Reels metrics.
- Exact body fields vary by network/publication type; the swagger file is the source of truth. Our client keeps all paths/fields in one typed module so schema drift is a one-file fix.

## Service layout (`src/lib/metricool/`)

- **MetricoolClient** — authenticated fetch (X-Mc-Auth + userId/blogId injection), retry/backoff on 429/5xx, timeout, typed errors. Token loaded per-user from `metricool_connections` (encrypted at rest with `ENCRYPTION_KEY`), never sent to the browser or to AI providers.
- Operations: `getBrands()`, `normalizeMediaUrl(url)`, `createScheduledPost(input)`, `getTimeline(metric, range)`, `getReelsAnalytics(range)`, `healthCheck()`.

## Publishing flow

```
pipeline-scheduler picks media + slot
  → scheduled_posts row (QUEUED, publishAt, caption, hashtags)
  → [ASSISTED mode: PENDING_APPROVAL until user approves]
  → queue metricool_publish at publishAt - lead time
  → metricool-publisher worker:
      1. verify connection healthy (else mark FAILED + insight "connection expired")
      2. presign R2 media URL (time-limited)
      3. GET /actions/normalize/image/url  → metricool-hosted media URL
      4. POST /v2/scheduler/posts (autoPublish per pipeline config, timezone from pipeline)
      5. store returned post id → status SENT_TO_METRICOOL
  → performance-sync polls analytics endpoints at T+1h/6h/24h/72h (configurable)
```

## Failure handling

- 401/403 → connection marked `EXPIRED`, all dependent pipelines paused for publishing (not scanning), user notified. Other pipelines with healthy connections continue — pipeline isolation.
- 429 → BullMQ backoff; publisher concurrency capped per connection.
- Post rejected by Metricool → scheduled_post FAILED with the API error message surfaced in UI; content returns to pool as AVAILABLE.
