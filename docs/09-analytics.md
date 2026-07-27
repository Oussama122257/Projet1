# 9. Performance Analytics Architecture

## Collection

`performance-sync` worker pulls from the Metricool analytics endpoints (timeline metrics, Reels analytics) for each connected destination on a configurable snapshot schedule after each publish: **T+0 (basic), T+1h, T+6h, T+24h, T+72h (final)** — stored as immutable snapshots in `post_performance` with `collectedAt`. Only metrics the API actually returns are stored; missing metrics are NULL, and the UI/AI never treat NULL as zero.

## Derived layers (SQL, not AI)

1. **Post metrics** — latest snapshot per post + computed `engagementRate` (interactions / reach when both present).
2. **Performance Score (0–100, configurable weights)** — z-normalized within the destination's own history: reach, engagement, shares, saves, watch time. Metrics are normalized before combining; missing metrics redistribute weight.
3. **Winner detection** — top 1% / 5% / 10% by performance score per destination + trait profiles of winners (avg duration, hook score, posting time, engagement).
4. **Heatmap** — day × hour matrix of mean performance score (min bucket size enforced; sparse cells rendered as "insufficient data").
5. **Source ranking** — mean performance of published posts per source.
6. **Fatigue & internal trends** — rolling windows detect declining engagement across recent posts and repeated hook/format streaks. Internal account trends are labeled as such; external platform trends are **never claimed** (no external trend data source is integrated yet).

## Dashboards

- `/analytics` — totals (views, reach, engagement rate, avg views/post), best/worst post, follower growth, AI performance score, trending internal format; time-series charts (views, reach, engagement, followers), heatmap, per-pipeline and per-destination breakdowns.
- `/analytics/top-content` — Top 10/25/50/100 with filters (pipeline, destination, date, content type, source, format): thumbnail, performance score, metric chips, AI analysis, "why it performed well" (data-backed traits + AI narrative, labeled separately).

## Honesty guarantees

- Every insight card shows sample size, confidence, and date range.
- Aggregates below minimum sample thresholds are suppressed or LOW-confidence.
- Empty state: with no performance data, dashboards show explicit "no data yet" states — never fabricated numbers.
