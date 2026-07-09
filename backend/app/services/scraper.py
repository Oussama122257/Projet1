"""Instagram scraping via yt-dlp.

We use yt-dlp because it is actively maintained and handles Instagram video
extraction + download in one tool. Every network call goes through the proxy
assigned to the source account's proxy group.

NOTE: scraping Instagram violates its Terms of Use. Use burner scraper accounts
and rotating residential proxies; treat bans as expected, not exceptional.
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

import imagehash
import yt_dlp
from PIL import Image

MEDIA_DIR = Path(os.getenv("MEDIA_DIR", "/media"))


@dataclass
class ScrapedItem:
    shortcode: str
    caption: str | None
    duration: int | None
    filepath: Path
    thumbnail: Path | None


def _proxy_for(proxy_group: str) -> str | None:
    """Resolve a proxy URL for a group from env, e.g. PROXY_EU_RES_01=http://user:pass@host:port.

    Falls back to no proxy in development.
    """
    key = f"PROXY_{proxy_group.upper().replace('-', '_')}"
    return os.getenv(key) or os.getenv("PROXY_DEFAULT")


def list_recent_shortcodes(username: str, proxy_group: str, limit: int = 12) -> list[str]:
    """Return recent post shortcodes for an account without downloading media."""
    opts = {
        "quiet": True,
        "extract_flat": True,
        "playlistend": limit,
        "proxy": _proxy_for(proxy_group),
    }
    url = f"https://www.instagram.com/{username}/"
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=False)
    entries = info.get("entries", []) if info else []
    return [e.get("id") for e in entries if e.get("id")]


def download_video(shortcode: str, proxy_group: str) -> ScrapedItem:
    """Download a single reel/video by shortcode into MEDIA_DIR."""
    MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    outtmpl = str(MEDIA_DIR / f"{shortcode}.%(ext)s")
    opts = {
        "quiet": True,
        "outtmpl": outtmpl,
        "format": "mp4/bestvideo+bestaudio",
        "writethumbnail": True,
        "proxy": _proxy_for(proxy_group),
        # Be gentle: yt-dlp built-in throttling + a socket timeout.
        "socket_timeout": 30,
        "retries": 3,
    }
    url = f"https://www.instagram.com/reel/{shortcode}/"
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=True)

    filepath = Path(MEDIA_DIR / f"{shortcode}.mp4")
    thumb = next(MEDIA_DIR.glob(f"{shortcode}.*[!mp4]"), None)
    return ScrapedItem(
        shortcode=shortcode,
        caption=(info.get("description") or info.get("title")) if info else None,
        duration=int(info["duration"]) if info and info.get("duration") else None,
        filepath=filepath,
        thumbnail=thumb if thumb and thumb.suffix in {".jpg", ".png", ".webp"} else None,
    )


def perceptual_hash(item: ScrapedItem) -> str | None:
    """Perceptual hash of the thumbnail, used to skip near-duplicate re-uploads."""
    if not item.thumbnail or not item.thumbnail.exists():
        return None
    try:
        with Image.open(item.thumbnail) as img:
            return str(imagehash.phash(img))
    except Exception:
        return None
