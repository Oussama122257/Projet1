"""Minimal Metricool client: normalize a media URL, then schedule a Reel.

Metricool does NOT accept direct file uploads — it fetches media from a public
URL. The documented flow is:
  1. GET  /api/actions/normalize/image/url?url=<public_url>   -> a Metricool-hosted URL
  2. POST /api/v2/scheduler/posts                             -> create the scheduled post

⚠️ Metricool's exact request shape/auth has changed across API versions. Confirm
against the live docs at https://app.metricool.com/resources/apidocs/index.html
and tweak `_auth_params()` / `build_payload()` below if a call is rejected. Use
`--dry-run` first to see exactly what would be sent.
"""
from __future__ import annotations

from datetime import datetime

import httpx


class MetricoolError(RuntimeError):
    pass


class Metricool:
    def __init__(self, cfg: dict):
        self.base = cfg["base_url"].rstrip("/")
        self.token = cfg["user_token"]
        self.user_id = cfg["user_id"]
        self.blog_id = cfg["blog_id"]
        self.network = cfg.get("network", "instagram")
        self.timezone = None  # set by caller per post

    def _auth_params(self) -> dict:
        # Metricool authenticates API calls with the user token + ids as query params.
        return {"userToken": self.token, "userId": self.user_id, "blogId": self.blog_id}

    def normalize(self, public_url: str) -> str:
        """Ask Metricool to host the media; return the normalized URL.

        Best-effort: if the endpoint is unavailable we fall back to the raw URL,
        which Metricool can still fetch as long as it's public and non-expiring.
        """
        url = f"{self.base}/actions/normalize/image/url"
        try:
            with httpx.Client(timeout=60) as c:
                r = c.get(url, params={**self._auth_params(), "url": public_url})
                r.raise_for_status()
                data = r.json()
            return data.get("data") or data.get("url") or public_url
        except Exception:
            return public_url

    def build_payload(self, media_url: str, caption: str, publish_local: datetime, tz: str) -> dict:
        """The scheduler post body. Isolated so it's easy to adjust to the API."""
        return {
            "providers": [{"network": self.network}],
            "publicationDate": {
                "dateTime": publish_local.strftime("%Y-%m-%dT%H:%M:%S"),
                "timezone": tz,
            },
            "text": caption or "",
            "media": [media_url],
            "autoPublish": True,
        }

    def schedule_reel(self, media_url: str, caption: str, publish_local: datetime, tz: str) -> str:
        normalized = self.normalize(media_url)
        payload = self.build_payload(normalized, caption, publish_local, tz)
        url = f"{self.base}/v2/scheduler/posts"
        with httpx.Client(timeout=60) as c:
            r = c.post(url, params=self._auth_params(), json=payload)
        if r.status_code >= 300:
            raise MetricoolError(f"{r.status_code}: {r.text}")
        data = r.json() if r.content else {}
        return str(data.get("id") or data.get("postId") or "scheduled")
