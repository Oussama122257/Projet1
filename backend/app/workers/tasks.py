"""Celery tasks: the hourly scan → download → store → schedule → publish pipeline."""
from __future__ import annotations

import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.config import settings
from app.database import SessionLocal
from app.models import (
    AccountStatus,
    DestinationAccount,
    PostStatus,
    RoutingRule,
    ScheduledPost,
    ScrapedVideo,
    SourceAccount,
    VideoStatus,
)
from app.services import drive, metricool, telegram
from app.services import scraper
from app.workers.celery_app import celery_app


# ---------- Hourly fan-out ----------
@celery_app.task
def enqueue_scans() -> int:
    """Called by Beat every hour. Queue one scan per active source, with jitter."""
    with SessionLocal() as db:
        sources = db.scalars(
            select(SourceAccount).where(SourceAccount.is_active.is_(True))
        ).all()
        now = datetime.now(timezone.utc)
        queued = 0
        for src in sources:
            if src.cooldown_until and src.cooldown_until > now:
                continue
            jitter = random.randint(0, settings.scan_jitter_seconds)
            scan_source.apply_async(args=[src.id], countdown=jitter)
            queued += 1
    return queued


# ---------- Per-account scan ----------
@celery_app.task(bind=True, max_retries=2)
def scan_source(self, source_id: int) -> int:
    """Scan one source account for new videos and enqueue downloads."""
    with SessionLocal() as db:
        src = db.get(SourceAccount, source_id)
        if not src or not src.is_active:
            return 0
        try:
            shortcodes = scraper.list_recent_shortcodes(src.username, src.proxy_group)
        except Exception as exc:  # likely rate-limited / proxy issue
            _cooldown(db, src, hours=2, reason=str(exc))
            telegram.notify(f"⚠️ <b>@{src.username}</b> scan failed — cooldown 2h. {exc}")
            raise self.retry(exc=exc, countdown=120)

        # Skip shortcodes we already have (cheap dedupe).
        known = set(
            db.scalars(
                select(ScrapedVideo.ig_shortcode).where(
                    ScrapedVideo.ig_shortcode.in_(shortcodes)
                )
            ).all()
        )
        new_codes = [c for c in shortcodes if c not in known][: settings.max_downloads_per_scan]

        src.last_scanned_at = datetime.now(timezone.utc)
        src.status = AccountStatus.healthy
        db.commit()

    for code in new_codes:
        download_and_store.delay(source_id, code)
    return len(new_codes)


# ---------- Download + dedupe + Drive ----------
@celery_app.task(bind=True, max_retries=2)
def download_and_store(self, source_id: int, shortcode: str) -> int | None:
    with SessionLocal() as db:
        src = db.get(SourceAccount, source_id)
        if not src:
            return None
        try:
            item = scraper.download_video(shortcode, src.proxy_group)
        except Exception as exc:
            raise self.retry(exc=exc, countdown=90)

        phash = scraper.perceptual_hash(item)
        # Strong dedupe: skip if we've seen a near-identical clip before.
        if phash and db.scalar(select(ScrapedVideo).where(ScrapedVideo.phash == phash)):
            return None

        video = ScrapedVideo(
            source_id=source_id,
            ig_shortcode=shortcode,
            phash=phash,
            caption=item.caption,
            duration=item.duration,
            status=VideoStatus.processed,
        )
        db.add(video)
        db.flush()

        # Store in Google Drive.
        try:
            video.drive_file_id = drive.upload_video(item.filepath, src.username)
        except Exception:
            pass  # keep the record; a retry job can re-upload

        # Stage a public URL for Metricool if a CDN base is configured.
        if settings.media_public_base_url:
            video.media_url = f"{settings.media_public_base_url.rstrip('/')}/{item.filepath.name}"

        video.status = VideoStatus.queued  # awaits approval
        video_id = video.id
        caption = video.caption or ""
        username = src.username
        db.commit()

    telegram.request_approval(video_id, caption, username)
    return video_id


# ---------- Schedule an approved video ----------
@celery_app.task
def schedule_video(video_id: int) -> int:
    """Create a Metricool scheduled Reel for each destination routed from the source."""
    created = 0
    with SessionLocal() as db:
        video = db.get(ScrapedVideo, video_id)
        if not video or not video.media_url:
            return 0
        dests = db.scalars(
            select(DestinationAccount)
            .join(RoutingRule, RoutingRule.destination_id == DestinationAccount.id)
            .where(RoutingRule.source_id == video.source_id, RoutingRule.is_active.is_(True))
        ).all()

        for dest in dests:
            slot = _next_open_slot(db, dest)
            try:
                post_id = metricool.schedule_reel(
                    brand_id=dest.metricool_brand_id or "",
                    media_url=video.media_url,
                    caption=video.caption or "",
                    publish_at=slot,
                )
            except Exception as exc:
                telegram.notify(f"⚠️ Failed to schedule to @{dest.username}: {exc}")
                continue
            db.add(ScheduledPost(
                video_id=video.id, destination_id=dest.id,
                metricool_post_id=post_id, scheduled_at=slot, status=PostStatus.scheduled,
            ))
            created += 1

        video.status = VideoStatus.scheduled
        db.commit()

    if created:
        telegram.notify(f"📅 Scheduled clip to {created} account(s).")
    return created


# ---------- Reconcile publish state from Metricool ----------
@celery_app.task
def reconcile_published() -> int:
    updated = 0
    with SessionLocal() as db:
        pending = db.scalars(
            select(ScheduledPost).where(ScheduledPost.status == PostStatus.scheduled)
        ).all()
        for post in pending:
            if not post.metricool_post_id or not post.scheduled_at:
                continue
            if post.scheduled_at > datetime.now(timezone.utc):
                continue  # not due yet
            dest = db.get(DestinationAccount, post.destination_id)
            try:
                state = metricool.get_post_status(dest.metricool_brand_id or "", post.metricool_post_id)
            except Exception:
                continue
            if state == "published":
                post.status = PostStatus.published
                updated += 1
        db.commit()
    return updated


# ---------- Helpers ----------
def _cooldown(db, src: SourceAccount, hours: int, reason: str) -> None:
    src.status = AccountStatus.rate_limited
    src.cooldown_until = datetime.now(timezone.utc) + timedelta(hours=hours)
    db.commit()


def _next_open_slot(db, dest: DestinationAccount) -> datetime:
    """Find the next posting slot that respects the destination's daily cap.

    Simple strategy: spread `daily_cap` posts evenly across the day, starting
    tomorrow, filling days until one has capacity.
    """
    now = datetime.now(timezone.utc)
    cap = max(1, dest.daily_cap)
    spacing = timedelta(hours=24 / cap)
    day = now.replace(hour=9, minute=0, second=0, microsecond=0)  # first slot at 09:00
    for _ in range(30):  # look up to 30 days ahead
        day_start = day
        day_end = day + timedelta(days=1)
        used = db.scalar(
            select(ScheduledPost)
            .where(
                ScheduledPost.destination_id == dest.id,
                ScheduledPost.scheduled_at >= day_start,
                ScheduledPost.scheduled_at < day_end,
            )
            .order_by(ScheduledPost.scheduled_at.desc())
        )
        count_today = db.query(ScheduledPost).filter(
            ScheduledPost.destination_id == dest.id,
            ScheduledPost.scheduled_at >= day_start,
            ScheduledPost.scheduled_at < day_end,
        ).count()
        if count_today < cap:
            slot = day + spacing * count_today
            if slot > now:
                return slot
        day = day + timedelta(days=1)
    return now + timedelta(days=1)
