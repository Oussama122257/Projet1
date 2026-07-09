"""Upload a local video to S3-compatible storage and return its public URL.

Works with Cloudflare R2, Amazon S3, Backblaze B2, Wasabi — anything with an
S3 API. The bucket/object must be publicly readable so Metricool can fetch it.
"""
from __future__ import annotations

import tempfile
from pathlib import Path


def download_temp(url: str, name: str) -> Path:
    """Stream a remote video to a temp file so it can be re-uploaded to staging."""
    import httpx

    dest = Path(tempfile.gettempdir()) / f"{name}.mp4"
    with httpx.stream("GET", url, timeout=300, follow_redirects=True) as r:
        r.raise_for_status()
        with dest.open("wb") as f:
            for chunk in r.iter_bytes(1 << 16):
                f.write(chunk)
    return dest


def upload(cfg: dict, path: Path, key: str | None = None) -> str:
    """Upload `path` to the configured bucket and return a public URL."""
    import boto3
    from botocore.config import Config

    key = key or path.name
    session = boto3.session.Session()
    client = session.client(
        "s3",
        endpoint_url=cfg["endpoint_url"],
        aws_access_key_id=cfg["access_key_id"],
        aws_secret_access_key=cfg["secret_access_key"],
        region_name=cfg.get("region", "auto"),
        config=Config(signature_version="s3v4"),
    )
    extra = {"ContentType": "video/mp4"}
    client.upload_file(str(path), cfg["bucket"], key, ExtraArgs=extra)
    return f"{cfg['public_base_url'].rstrip('/')}/{key}"
