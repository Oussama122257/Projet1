#!/usr/bin/env python3
"""Fully automated: Instagram link -> Apify download -> Metricool schedule.

    python publish_links.py https://www.instagram.com/reel/XXXX/
    python publish_links.py --file links.txt
    python publish_links.py --file links.txt --dry-run
    python publish_links.py https://.../reel/XXXX/ --now
    python publish_links.py --list

Give it one or more Instagram links (reel / post / tv). For each, it runs the
Apify Instagram scraper to get the direct video URL + caption, then schedules it
as a Reel in Metricool at the next open slot. Already-published links are skipped.

No storage bucket is needed by default: Metricool's `normalize` step ingests the
Apify video URL onto Metricool's own servers. Set `[media] mode = "stage"` to
download + re-upload to your own bucket instead.
"""
from __future__ import annotations

import argparse
import sys
import tomllib
from datetime import datetime, timedelta
from pathlib import Path

import scheduler as slots
import state as store
from apify import shortcode_from_url

CONFIG = Path(__file__).with_name("config.toml")


def load_config() -> dict:
    if not CONFIG.exists():
        sys.exit("No config.toml — copy config.example.toml to config.toml and fill it in.")
    with CONFIG.open("rb") as f:
        return tomllib.load(f)


def read_links(args) -> list[str]:
    links = list(args.links)
    if args.file:
        for line in Path(args.file).expanduser().read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#"):
                links.append(line)
    # de-dup while keeping order
    seen, out = set(), []
    for l in links:
        if l not in seen:
            seen.add(l)
            out.append(l)
    return out


def resolve_media_url(cfg: dict, video, dry_run: bool) -> str:
    """Return the URL to hand to Metricool: Apify's URL, or a re-staged bucket URL."""
    mode = cfg.get("media", {}).get("mode", "normalize")
    if mode == "stage":
        import staging
        tmp = staging.download_temp(video.video_url, video.shortcode)
        try:
            return staging.upload(cfg["staging"], tmp, key=f"{video.shortcode}.mp4")
        finally:
            tmp.unlink(missing_ok=True)
    return video.video_url  # Metricool.normalize() will ingest this


def process(cfg: dict, links: list[str], dry_run: bool, publish_now: bool) -> int:
    st = store.load()
    planner = slots.SlotPlanner(cfg["schedule"], st.get("next_slot"))
    tz = cfg["schedule"]["timezone"]

    # Skip links already published (by shortcode).
    todo = []
    for link in links:
        sc = shortcode_from_url(link) or link
        if store.is_done(st, sc):
            print(f"↷ already done: {link}")
            continue
        todo.append((link, sc))

    if not todo:
        print("Nothing new to publish.")
        return 0

    apify = mc = None
    if not dry_run:
        from apify import Apify
        from metricool import Metricool
        apify = Apify(cfg["apify"])
        mc = Metricool(cfg["metricool"])

    print(f"Publishing {len(todo)} link(s).\n")
    count = 0
    for link, sc in todo:
        if publish_now:
            slot_local = datetime.now(planner.tz) + timedelta(minutes=3)
        else:
            slot_local = planner.next_slot()
        when = slot_local.strftime("%a %d %b %Y %H:%M %Z")

        if dry_run:
            print(f"• {link}\n    shortcode: {sc}\n    publish: {when}  (dry run — Apify/Metricool not called)")
            count += 1
            continue

        try:
            video = apify.fetch(link)
            caption = video.caption
            media_url = resolve_media_url(cfg, video, dry_run)
            post_id = mc.schedule_reel(media_url, caption, slot_local, tz)
        except Exception as exc:
            print(f"• {link}\n    ✗ failed: {exc}\n")
            continue

        store.mark_done(st, video.shortcode, {
            "link": link, "post_id": post_id,
            "publish_at": slot_local.isoformat(),
            "caption": (caption or "")[:80],
        })
        st["next_slot"] = planner.cursor_iso
        store.save(st)
        print(f"• {link}\n    caption: {caption[:60] or '(none)'}\n    publish: {when}\n    ✓ scheduled (Metricool id {post_id})\n")
        count += 1

    print(f"{'Would publish' if dry_run else 'Published'} {count} link(s).")
    return count


def cmd_list() -> None:
    st = store.load()
    rows = list(st.get("scheduled", {}).values())
    if not rows:
        print("Nothing scheduled yet.")
        return
    rows.sort(key=lambda r: r.get("publish_at", ""))
    for r in rows:
        tag = r.get("link") or r.get("file", "?")
        print(f"{r.get('publish_at', '?'):<32} {tag}  (id {r.get('post_id')})")


def main() -> None:
    ap = argparse.ArgumentParser(description="Instagram link -> Apify -> Metricool, fully automated.")
    ap.add_argument("links", nargs="*", help="Instagram reel/post links")
    ap.add_argument("--file", help="text file with one Instagram link per line")
    ap.add_argument("--dry-run", action="store_true", help="show the plan; call nothing")
    ap.add_argument("--now", action="store_true", help="schedule ~3 min out instead of the next slot")
    ap.add_argument("--list", action="store_true", help="list already-scheduled links")
    args = ap.parse_args()

    cfg = load_config()
    if args.list:
        cmd_list()
        return

    links = read_links(args)
    if not links:
        sys.exit("Give at least one Instagram link, or --file links.txt.")
    process(cfg, links, args.dry_run, args.now)


if __name__ == "__main__":
    main()
