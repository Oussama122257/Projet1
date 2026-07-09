"""Database models for the Reelay pipeline.

The pipeline moves a video through explicit states:
scraped -> processed -> queued -> scheduled -> published (or failed / skipped).
"""
from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AccountStatus(str, enum.Enum):
    healthy = "healthy"
    cooldown = "cooldown"
    rate_limited = "rate_limited"
    disabled = "disabled"


class VideoStatus(str, enum.Enum):
    scraped = "scraped"
    processed = "processed"
    queued = "queued"        # waiting for human approval
    scheduled = "scheduled"
    published = "published"
    failed = "failed"
    skipped = "skipped"


class PostStatus(str, enum.Enum):
    scheduled = "scheduled"
    published = "published"
    failed = "failed"


class SourceAccount(Base):
    __tablename__ = "source_accounts"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    proxy_group: Mapped[str] = mapped_column(String(64), default="default")
    status: Mapped[AccountStatus] = mapped_column(
        Enum(AccountStatus), default=AccountStatus.healthy
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_scanned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cooldown_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    videos: Mapped[list["ScrapedVideo"]] = relationship(back_populates="source")
    routes: Mapped[list["RoutingRule"]] = relationship(back_populates="source")


class DestinationAccount(Base):
    __tablename__ = "destination_accounts"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    metricool_brand_id: Mapped[str | None] = mapped_column(String(64))
    timezone: Mapped[str] = mapped_column(String(64), default="UTC")
    daily_cap: Mapped[int] = mapped_column(Integer, default=4)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    routes: Mapped[list["RoutingRule"]] = relationship(back_populates="destination")


class RoutingRule(Base):
    """Which source account feeds which destination account."""

    __tablename__ = "routing_rules"
    __table_args__ = (UniqueConstraint("source_id", "destination_id", name="uq_route"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("source_accounts.id", ondelete="CASCADE"))
    destination_id: Mapped[int] = mapped_column(
        ForeignKey("destination_accounts.id", ondelete="CASCADE")
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    source: Mapped[SourceAccount] = relationship(back_populates="routes")
    destination: Mapped[DestinationAccount] = relationship(back_populates="routes")


class ScrapedVideo(Base):
    __tablename__ = "scraped_videos"

    id: Mapped[int] = mapped_column(primary_key=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("source_accounts.id", ondelete="CASCADE"))
    ig_shortcode: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    phash: Mapped[str | None] = mapped_column(String(64), index=True)  # perceptual hash for dedupe
    caption: Mapped[str | None] = mapped_column(Text)
    duration: Mapped[int | None] = mapped_column(Integer)
    drive_file_id: Mapped[str | None] = mapped_column(String(128))
    media_url: Mapped[str | None] = mapped_column(String(512))  # staged public URL for Metricool
    status: Mapped[VideoStatus] = mapped_column(Enum(VideoStatus), default=VideoStatus.scraped, index=True)
    error: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    source: Mapped[SourceAccount] = relationship(back_populates="videos")
    posts: Mapped[list["ScheduledPost"]] = relationship(back_populates="video")


class ScheduledPost(Base):
    __tablename__ = "scheduled_posts"

    id: Mapped[int] = mapped_column(primary_key=True)
    video_id: Mapped[int] = mapped_column(ForeignKey("scraped_videos.id", ondelete="CASCADE"))
    destination_id: Mapped[int] = mapped_column(
        ForeignKey("destination_accounts.id", ondelete="CASCADE")
    )
    metricool_post_id: Mapped[str | None] = mapped_column(String(64))
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[PostStatus] = mapped_column(Enum(PostStatus), default=PostStatus.scheduled, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    video: Mapped[ScrapedVideo] = relationship(back_populates="posts")
    destination: Mapped[DestinationAccount] = relationship()


class Job(Base):
    """Lightweight record of pipeline runs for observability."""

    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    type: Mapped[str] = mapped_column(String(32))          # scan | download | schedule | publish
    target: Mapped[str | None] = mapped_column(String(64))  # e.g. source username
    status: Mapped[str] = mapped_column(String(16), default="pending")
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    last_error: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
