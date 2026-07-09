"""Local JSON state: which files we've already scheduled, and the slot cursor.

Kept next to the tool as `state.json`. Dedupe is by content fingerprint (size +
a hash of the head/tail of the file), so renaming a file won't re-schedule it.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

STATE_FILE = Path(__file__).with_name("state.json")


def fingerprint(path: Path) -> str:
    """Cheap, stable content fingerprint: size + first/last 256 KiB."""
    size = path.stat().st_size
    h = hashlib.sha1(str(size).encode())
    chunk = 256 * 1024
    with path.open("rb") as f:
        h.update(f.read(chunk))
        if size > chunk:
            f.seek(max(0, size - chunk))
            h.update(f.read(chunk))
    return h.hexdigest()


def load() -> dict:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {"scheduled": {}, "next_slot": None}


def save(state: dict) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2, default=str))


def is_done(state: dict, fp: str) -> bool:
    return fp in state["scheduled"]


def mark_done(state: dict, fp: str, info: dict) -> None:
    state["scheduled"][fp] = info
