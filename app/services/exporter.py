"""CSV export service."""

import os
import io
from datetime import datetime
import pandas as pd


OUTPUT_DIR = "./output"


def ensure_output_dir():
    os.makedirs(OUTPUT_DIR, exist_ok=True)


def export_posts_csv(posts: list[dict], username: str) -> str:
    ensure_output_dir()
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = os.path.join(OUTPUT_DIR, f"posts_{username}_{ts}.csv")
    pd.DataFrame(posts).to_csv(path, index=False)
    return path


def export_profile_csv(profile: dict) -> str:
    ensure_output_dir()
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = os.path.join(OUTPUT_DIR, f"profile_{profile.get('username', 'unknown')}_{ts}.csv")
    pd.DataFrame([profile]).to_csv(path, index=False)
    return path


def export_ai_csv(ai_result: dict, username: str) -> str:
    ensure_output_dir()
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = os.path.join(OUTPUT_DIR, f"ai_{username}_{ts}.csv")
    rows = [
        {"title": idea.get("title", ""), "text": idea.get("text", ""), "analysis": ai_result.get("analysis", "")}
        for idea in ai_result.get("post_ideas", [])
    ]
    if not rows:
        rows = [{"analysis": ai_result.get("analysis", "")}]
    pd.DataFrame(rows).to_csv(path, index=False)
    return path


def generate_csv_bytes(data: list[dict]) -> bytes:
    """Generate CSV as bytes for download."""
    df = pd.DataFrame(data)
    buf = io.BytesIO()
    df.to_csv(buf, index=False)
    return buf.getvalue()
