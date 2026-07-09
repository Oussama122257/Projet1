"""Content library: list scraped videos and approve/skip queued ones."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ScrapedVideo, VideoStatus
from app.schemas import VideoDecision, VideoOut

router = APIRouter(prefix="/api", tags=["videos"])


@router.get("/videos", response_model=list[VideoOut])
def list_videos(
    status: VideoStatus | None = Query(default=None),
    source_id: int | None = Query(default=None),
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db),
):
    stmt = select(ScrapedVideo).order_by(ScrapedVideo.created_at.desc()).limit(limit)
    if status:
        stmt = stmt.where(ScrapedVideo.status == status)
    if source_id:
        stmt = stmt.where(ScrapedVideo.source_id == source_id)
    return db.scalars(stmt).all()


@router.post("/videos/{video_id}/decision", response_model=VideoOut)
def decide_video(video_id: int, decision: VideoDecision, db: Session = Depends(get_db)):
    """Human approval gate. Approving moves the video toward scheduling."""
    video = db.get(ScrapedVideo, video_id)
    if not video:
        raise HTTPException(404, "Video not found.")
    if video.status not in (VideoStatus.queued, VideoStatus.processed):
        raise HTTPException(409, f"Video is '{video.status.value}', not awaiting a decision.")

    if decision.caption is not None:
        video.caption = decision.caption

    if decision.approve:
        video.status = VideoStatus.scheduled  # picked up by the scheduling task
        # Enqueue scheduling asynchronously; import here to avoid a hard dep at API import time.
        try:
            from app.workers.tasks import schedule_video
            schedule_video.delay(video.id)
        except Exception:  # pragma: no cover - queue optional in dev
            pass
    else:
        video.status = VideoStatus.skipped

    db.commit()
    db.refresh(video)
    return video
