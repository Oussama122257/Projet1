"""Apify client — download an Instagram video's direct URL + caption from a link.

Uses the official `apify/instagram-scraper` actor via the synchronous endpoint:
  POST https://api.apify.com/v2/acts/<actor>/run-sync-get-dataset-items?token=...
which runs the actor and returns the dataset items in one call.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

import httpx

_SHORTCODE_RE = re.compile(r"instagram\.com/(?:reel|reels|p|tv)/([A-Za-z0-9_-]+)")


def shortcode_from_url(url: str) -> str | None:
    m = _SHORTCODE_RE.search(url)
    return m.group(1) if m else None


@dataclass
class InstaVideo:
    shortcode: str
    video_url: str
    caption: str
    duration: float | None
    type: str


class ApifyError(RuntimeError):
    pass


class Apify:
    def __init__(self, cfg: dict):
        self.token = cfg["token"]
        self.actor = cfg.get("actor", "apify~instagram-scraper")

    def fetch(self, link: str) -> InstaVideo:
        """Run the actor for a single Instagram link and return its video info."""
        url = f"https://api.apify.com/v2/acts/{self.actor}/run-sync-get-dataset-items"
        payload = {
            "directUrls": [link],
            "resultsType": "posts",
            "resultsLimit": 1,
            "addParentData": False,
        }
        # Actor runs can take a while; give it room.
        with httpx.Client(timeout=300) as c:
            r = c.post(url, params={"token": self.token}, json=payload)
        if r.status_code >= 300:
            raise ApifyError(f"Apify {r.status_code}: {r.text[:300]}")
        items = r.json()
        if not items:
            raise ApifyError(f"No data returned for {link} (private, deleted, or not a video?)")

        item = items[0]
        video_url = item.get("videoUrl") or item.get("videoUrlHd")
        if not video_url:
            raise ApifyError(f"{link} has no videoUrl — is it actually a video/reel?")

        return InstaVideo(
            shortcode=item.get("shortCode") or shortcode_from_url(link) or link,
            video_url=video_url,
            caption=item.get("caption") or "",
            duration=item.get("videoDuration"),
            type=item.get("type", "Video"),
        )
