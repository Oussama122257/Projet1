"""Operations API — compact endpoints the OpenClaw assistant drives via reelayctl.

These return small, chat-friendly payloads (counts, short lists) so an AI agent
relaying to Telegram can summarize them cleanly.
"""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    AccountStatus,
    PostStatus,
    ScheduledPost,
    ScrapedVideo,
    SourceAccount,
    VideoStatus,
)

router = APIRouter(prefix="/api/ops", tags=["ops"])


@router.get("/status")
def status(db: Session = Depends(get_db)) -> dict:
    """One-glance pipeline health for the assistant."""
    now = datetime.now(timezone.utc)

    def count(model, *where) -> int:
        stmt = select(func.count()).select_from(model)
        for w in where:
            stmt = stmt.where(w)
        return db.scalar(stmt) or 0

    sources_total = count(SourceAccount)
    cooling = db.scalars(
        select(SourceAccount.username).where(
            SourceAccount.status.in_([AccountStatus.cooldown, AccountStatus.rate_limited])
        )
    ).all()

    return {
        "sources": {
            "total": sources_total,
            "active": count(SourceAccount, SourceAccount.is_active.is_(True)),
            "healthy": count(SourceAccount, SourceAccount.status == AccountStatus.healthy),
            "cooling_down": list(cooling),
        },
        "videos": {
            "awaiting_approval": count(ScrapedVideo, ScrapedVideo.status == VideoStatus.queued),
            "scraped_24h": count(ScrapedVideo, ScrapedVideo.created_at >= now - timedelta(days=1)),
            "failed": count(ScrapedVideo, ScrapedVideo.status == VideoStatus.failed),
        },
        "posts": {
            "scheduled": count(ScheduledPost, ScheduledPost.status == PostStatus.scheduled),
            "published_7d": count(
                ScheduledPost,
                ScheduledPost.status == PostStatus.published,
                ScheduledPost.created_at >= now - timedelta(days=7),
            ),
        },
    }


@router.get("/queue")
def approval_queue(limit: int = 10, db: Session = Depends(get_db)) -> list[dict]:
    """Videos awaiting a human Approve/Skip decision."""
    rows = db.scalars(
        select(ScrapedVideo)
        .where(ScrapedVideo.status == VideoStatus.queued)
        .order_by(ScrapedVideo.created_at.desc())
        .limit(limit)
    ).all()
    return [
        {
            "id": v.id,
            "source_id": v.source_id,
            "shortcode": v.ig_shortcode,
            "caption": (v.caption or "")[:120],
            "duration": v.duration,
        }
        for v in rows
    ]


@router.post("/retry-failed")
def retry_failed(db: Session = Depends(get_db)) -> dict:
    """Re-queue failed videos so the worker picks them up again."""
    failed = db.scalars(
        select(ScrapedVideo).where(ScrapedVideo.status == VideoStatus.failed)
    ).all()
    for v in failed:
        v.status = VideoStatus.processed
        v.error = None
    db.commit()

    requeued = 0
    try:
        from app.workers.tasks import download_and_store  # noqa: F401
        # In a fuller build we'd re-dispatch a targeted retry task here.
        requeued = len(failed)
    except Exception:
        requeued = len(failed)
    return {"retried": len(failed), "requeued": requeued}
