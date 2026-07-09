"""Metricool API client for scheduling Instagram Reels.

Metricool API access requires an Advanced plan or above. Generate a token in
Settings -> API. Metricool needs a *publicly reachable media URL*, so stage the
downloaded file on object storage (Cloudflare R2 / S3) and pass that URL here.

Endpoint shapes vary by Metricool API version — confirm against the current API
PDF from their help center and adjust the payload/paths if needed.
"""
from __future__ import annotations

from datetime import datetime

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.metricool_api_token}",
        "Content-Type": "application/json",
    }


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=16))
def schedule_reel(
    *,
    brand_id: str,
    media_url: str,
    caption: str,
    publish_at: datetime,
) -> str:
    """Create a scheduled Instagram Reel in Metricool. Returns the Metricool post id."""
    payload = {
        "userId": settings.metricool_user_id,
        "blogId": brand_id,
        "providers": [{"network": "instagram"}],
        "publicationDate": publish_at.isoformat(),
        "text": caption or "",
        "media": [{"url": media_url, "type": "video"}],
        "autoPublish": True,
    }
    url = f"{settings.metricool_base_url}/v1/scheduler/posts"
    with httpx.Client(timeout=30) as client:
        resp = client.post(url, json=payload, headers=_headers())
        resp.raise_for_status()
        data = resp.json()
    return str(data.get("id") or data.get("postId") or "")


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=16))
def get_post_status(brand_id: str, post_id: str) -> str:
    """Return Metricool's status for a scheduled post (e.g. 'scheduled' / 'published')."""
    url = f"{settings.metricool_base_url}/v1/scheduler/posts/{post_id}"
    params = {"userId": settings.metricool_user_id, "blogId": brand_id}
    with httpx.Client(timeout=30) as client:
        resp = client.get(url, params=params, headers=_headers())
        resp.raise_for_status()
        return resp.json().get("status", "unknown")
