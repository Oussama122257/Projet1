"""Celery application + Beat schedule.

Beat fires `enqueue_scans` once per hour. That task fans out one `scan_source`
job per active source account, each with random jitter so we don't hammer
Instagram at exactly :00 (which looks robotic and gets accounts flagged).
"""
from celery import Celery
from celery.schedules import crontab

from app.config import settings

celery_app = Celery(
    "reelay",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_default_retry_delay=60,
    timezone="UTC",
)

# Run the hourly fan-out at minute 0 of every hour.
celery_app.conf.beat_schedule = {
    "hourly-scan-fanout": {
        "task": "app.workers.tasks.enqueue_scans",
        "schedule": crontab(minute=0),
    },
    # Publish-state reconciliation: ask Metricool what actually went live.
    "reconcile-published": {
        "task": "app.workers.tasks.reconcile_published",
        "schedule": crontab(minute=15),
    },
}
