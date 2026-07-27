# 7. Queues & Workers

Redis + BullMQ. Every queue has a dead-letter pattern (failed jobs retained), exponential backoff, and per-queue concurrency. The `jobs` table mirrors lifecycle events for the `/jobs` UI. Workers run in a separate container (`Dockerfile.worker`, entry `src/workers/index.ts`) and are horizontally scalable; all are idempotent (jobs carry natural keys and re-check state before acting).

| Queue | Worker | Trigger | Responsibility |
|---|---|---|---|
| `source_scan` | source-scanner | cron (per source `monitoringFrequency`) or manual | validate source (active, authorized, cooldown, no active run) → start Apify run |
| `apify_run` | apify-run-monitor | delayed self-requeue / webhook | poll run status; on success fetch dataset, normalize, dedupe, create media rows, fan out |
| `media_download` | media-ingestion | new media discovered | download eligible media → hash → dedupe → upload to R2 → thumbnail key |
| `media_processing` | media-processing | after download | FFmpeg keyframes, audio extraction, transcription, OCR → derived signals |
| `ai_analysis` | ai-analysis | after processing (if user consent + pipeline AI enabled) | provider analysis + scoring → ai_content_analysis, pipeline_media scores |
| `ai_embedding` | ai-embedding | after analysis | embeddings → pgvector |
| `pipeline_schedule` | pipeline-scheduler | cron per pipeline | fill upcoming slots: rank pool (score+diversity), pick media, generate caption (if enabled), create scheduled_posts (approval-gated in ASSISTED) |
| `metricool_publish` | metricool-publisher | delayed to publishAt | normalize media URL, POST /v2/scheduler/posts, record post id |
| `performance_sync` | performance-sync | delayed chain T+0/1h/6h/24h/72h (configurable) | pull metrics from Metricool analytics endpoints → post_performance snapshots |
| `experiment_analysis` | experiment-analysis | cron + experiment end | aggregate variant results, sample-size guard, effect size, AI interpretation |
| `ai_insights` | ai-insights | nightly cron + on new sync batches | SQL aggregates → AI interpretation → ai_insights + intelligence profiles + daily recommendations |
| `storage_cleanup` | storage-cleanup | daily cron | remove orphaned R2 objects, expire rejected media per retention policy |

## Isolation guarantees

- Jobs are keyed by pipeline/source; a failing pipeline's jobs retry with backoff in isolation and land in the failed set — they never block other pipelines' jobs (BullMQ processes jobs independently; concurrency per queue, fairness by round-robin enqueueing).
- Scheduler cron enumerates pipelines individually and enqueues one job per pipeline, so one pipeline's exception cannot abort the sweep.
- Graceful shutdown: workers drain on SIGTERM (`worker.close()`), containers get a stop grace period, jobs left mid-flight are retried thanks to idempotency.

## Scheduling repeatable jobs

BullMQ repeatable jobs (cron syntax) registered at worker boot:
- `source_scan:sweep` every 5 min → enqueues due sources.
- `pipeline_schedule:sweep` every 5 min → enqueues pipelines whose next slot window opens.
- `ai_insights:nightly` at 03:00 UTC per user batch.
- `storage_cleanup:daily` at 04:30 UTC.
