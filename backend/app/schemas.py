"""Pydantic request/response schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models import AccountStatus, PostStatus, VideoStatus


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --- Source accounts ---
class SourceAccountCreate(BaseModel):
    username: str
    proxy_group: str = "default"
    destination_ids: list[int] = []  # optional routing set up at creation


class SourceAccountOut(ORMModel):
    id: int
    username: str
    proxy_group: str
    status: AccountStatus
    is_active: bool
    last_scanned_at: datetime | None


# --- Destination accounts ---
class DestinationAccountCreate(BaseModel):
    username: str
    metricool_brand_id: str | None = None
    timezone: str = "UTC"
    daily_cap: int = 4


class DestinationAccountOut(ORMModel):
    id: int
    username: str
    metricool_brand_id: str | None
    timezone: str
    daily_cap: int
    is_active: bool


# --- Routing ---
class RoutingRuleCreate(BaseModel):
    source_id: int
    destination_id: int


class RoutingRuleOut(ORMModel):
    id: int
    source_id: int
    destination_id: int
    is_active: bool


# --- Videos ---
class VideoOut(ORMModel):
    id: int
    source_id: int
    ig_shortcode: str
    caption: str | None
    duration: int | None
    status: VideoStatus
    media_url: str | None
    created_at: datetime


class VideoDecision(BaseModel):
    """Human approval gate: approve or skip a queued video."""
    approve: bool
    caption: str | None = None


# --- Scheduled posts ---
class ScheduledPostOut(ORMModel):
    id: int
    video_id: int
    destination_id: int
    scheduled_at: datetime | None
    status: PostStatus


# --- Dashboard ---
class PipelineStage(BaseModel):
    key: str
    label: str
    count: int


class DashboardOverview(BaseModel):
    pipeline: list[PipelineStage]
    videos_today: int
    scheduled_ahead: int
    published_this_week: int
    proxy_health_pct: int
    sources_total: int
    sources_healthy: int
