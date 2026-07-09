"""Dashboard overview endpoint — the numbers behind the Reelay home screen."""
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
from app.schemas import DashboardOverview, PipelineStage

router = APIRouter(prefix="/api", tags=["dashboard"])


def _count(db: Session, stmt) -> int:
    return db.scalar(stmt) or 0


@router.get("/overview", response_model=DashboardOverview)
def overview(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    day_ago = now - timedelta(days=1)
    week_ago = now - timedelta(days=7)

    sources_total = _count(db, select(func.count()).select_from(SourceAccount))
    sources_healthy = _count(
        db,
        select(func.count())
        .select_from(SourceAccount)
        .where(SourceAccount.status == AccountStatus.healthy),
    )

    def videos_in(*statuses) -> int:
        return _count(
            db,
            select(func.count()).select_from(ScrapedVideo).where(ScrapedVideo.status.in_(statuses)),
        )

    pipeline = [
        PipelineStage(key="scanned", label="Scanned", count=sources_total),
        PipelineStage(
            key="downloaded",
            label="Downloaded",
            count=videos_in(VideoStatus.scraped, VideoStatus.processed, VideoStatus.queued,
                            VideoStatus.scheduled, VideoStatus.published),
        ),
        PipelineStage(
            key="drive",
            label="In Drive",
            count=_count(
                db,
                select(func.count()).select_from(ScrapedVideo).where(
                    ScrapedVideo.drive_file_id.is_not(None)
                ),
            ),
        ),
        PipelineStage(
            key="scheduled",
            label="Scheduled",
            count=_count(
                db,
                select(func.count()).select_from(ScheduledPost).where(
                    ScheduledPost.status == PostStatus.scheduled
                ),
            ),
        ),
        PipelineStage(
            key="published",
            label="Published",
            count=_count(
                db,
                select(func.count()).select_from(ScheduledPost).where(
                    ScheduledPost.status == PostStatus.published
                ),
            ),
        ),
    ]

    videos_today = _count(
        db,
        select(func.count()).select_from(ScrapedVideo).where(ScrapedVideo.created_at >= day_ago),
    )
    scheduled_ahead = _count(
        db,
        select(func.count()).select_from(ScheduledPost).where(
            ScheduledPost.status == PostStatus.scheduled, ScheduledPost.scheduled_at >= now
        ),
    )
    published_week = _count(
        db,
        select(func.count()).select_from(ScheduledPost).where(
            ScheduledPost.status == PostStatus.published, ScheduledPost.created_at >= week_ago
        ),
    )

    proxy_health = round(100 * sources_healthy / sources_total) if sources_total else 100

    return DashboardOverview(
        pipeline=pipeline,
        videos_today=videos_today,
        scheduled_ahead=scheduled_ahead,
        published_this_week=published_week,
        proxy_health_pct=proxy_health,
        sources_total=sources_total,
        sources_healthy=sources_healthy,
    )
