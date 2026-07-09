#!/usr/bin/env python3
"""Upload videos from a desktop folder to Metricool and schedule them as Reels.

    python upload_and_schedule.py            # process new videos once
    python upload_and_schedule.py --dry-run  # show the plan, upload/schedule nothing
    python upload_and_schedule.py --watch    # keep watching the folder
    python upload_and_schedule.py --list     # show already-scheduled files

Reads config.toml next to this file. See config.example.toml.
"""
from __future__ import annotations

import argparse
import sys
import time
import tomllib
from pathlib import Path

import scheduler as slots
import state as store

CONFIG = Path(__file__).with_name("config.toml")


def load_config() -> dict:
    if not CONFIG.exists():
        sys.exit("No config.toml — copy config.example.toml to config.toml and fill it in.")
    with CONFIG.open("rb") as f:
        return tomllib.load(f)


def find_videos(cfg: dict) -> list[Path]:
    folder = Path(cfg["folder"]["path"]).expanduser()
    if not folder.is_dir():
        sys.exit(f"Folder not found: {folder}")
    exts = {e.lower().lstrip(".") for e in cfg["folder"]["extensions"]}
    done = cfg["folder"].get("done_path", "")
    done_path = Path(done).expanduser() if done else None
    vids = []
    for p in sorted(folder.iterdir()):
        if done_path and done_path in p.parents:
            continue
        if p.is_file() and p.suffix.lower().lstrip(".") in exts:
            vids.append(p)
    return vids


def caption_for(cfg: dict, path: Path) -> str:
    if cfg["folder"].get("caption_from_filename", True):
        return path.stem.replace("_", " ").strip()
    return cfg["folder"].get("default_caption", "")


def move_to_done(cfg: dict, path: Path) -> None:
    done = cfg["folder"].get("done_path", "")
    if not done:
        return
    done_path = Path(done).expanduser()
    done_path.mkdir(parents=True, exist_ok=True)
    path.rename(done_path / path.name)


def process_once(cfg: dict, dry_run: bool) -> int:
    st = store.load()
    planner = slots.SlotPlanner(cfg["schedule"], st.get("next_slot"))
    tz = cfg["schedule"]["timezone"]

    videos = find_videos(cfg)
    pending = [(p, store.fingerprint(p)) for p in videos]
    pending = [(p, fp) for p, fp in pending if not store.is_done(st, fp)]

    if not pending:
        print("Nothing new to schedule.")
        return 0

    print(f"Found {len(pending)} new video(s).\n")
    mc = None
    if not dry_run:
        from metricool import Metricool
        import staging
        mc = Metricool(cfg["metricool"])

    count = 0
    for path, fp in pending:
        slot_local = planner.next_slot()
        caption = caption_for(cfg, path)
        when = slot_local.strftime("%a %d %b %Y %H:%M %Z")
        print(f"• {path.name}\n    caption: {caption or '(none)'}\n    publish: {when}")

        if dry_run:
            count += 1
            continue

        try:
            public_url = staging.upload(cfg["staging"], path)
            post_id = mc.schedule_reel(public_url, caption, slot_local, tz)
        except Exception as exc:
            print(f"    ✗ failed: {exc}\n")
            continue

        store.mark_done(st, fp, {
            "file": path.name, "post_id": post_id,
            "publish_at": slot_local.isoformat(), "media_url": public_url,
        })
        st["next_slot"] = planner.cursor_iso
        store.save(st)
        move_to_done(cfg, path)
        print(f"    ✓ scheduled (Metricool id {post_id})\n")
        count += 1

    if dry_run:
        print(f"\nDry run — would schedule {count} video(s). Nothing was uploaded.")
    else:
        print(f"Done — scheduled {count} video(s).")
    return count


def cmd_list() -> None:
    st = store.load()
    rows = list(st.get("scheduled", {}).values())
    if not rows:
        print("Nothing scheduled yet.")
        return
    rows.sort(key=lambda r: r.get("publish_at", ""))
    for r in rows:
        print(f"{r.get('publish_at', '?'):<32} {r['file']}  (id {r.get('post_id')})")


def main() -> None:
    ap = argparse.ArgumentParser(description="Upload desktop videos to Metricool and schedule them.")
    ap.add_argument("--dry-run", action="store_true", help="show the plan without uploading/scheduling")
    ap.add_argument("--watch", action="store_true", help="keep watching the folder")
    ap.add_argument("--interval", type=int, default=300, help="watch poll seconds (default 300)")
    ap.add_argument("--list", action="store_true", help="list already-scheduled files")
    args = ap.parse_args()

    cfg = load_config()

    if args.list:
        cmd_list()
        return

    if args.watch:
        print(f"Watching {cfg['folder']['path']} every {args.interval}s. Ctrl-C to stop.")
        try:
            while True:
                process_once(cfg, args.dry_run)
                time.sleep(args.interval)
        except KeyboardInterrupt:
            print("\nStopped.")
    else:
        process_once(cfg, args.dry_run)


if __name__ == "__main__":
    main()
