# Desktop → Metricool uploader

A small tool that takes videos from a folder on your desktop, stages each one to
public storage, and **schedules it as an Instagram Reel in Metricool** at the next
open slot. It remembers what it already scheduled, so you can just keep dropping
files into the folder.

```
Desktop folder ──▶ upload to public storage ──▶ Metricool normalize ──▶ schedule Reel
```

## Why staging is needed

Metricool's API **can't take a file upload** — it fetches media from a public,
non-expiring URL. So each video is uploaded to S3-compatible storage first
(Cloudflare R2 has a free tier and works great), then handed to Metricool.

## Setup

1. **Python 3.11+**, then install deps:
   ```bash
   cd desktop-uploader
   python3 -m pip install -r requirements.txt
   ```
2. **Config:** `cp config.example.toml config.toml` and fill in:
   - `[folder] path` — your desktop folder of videos.
   - `[metricool]` — token/user id/blog id (Advanced plan → Settings → API; the
     blog id is the Instagram profile you publish to).
   - `[schedule]` — timezone, posts per day, earliest/latest hour.
   - `[staging]` — an S3-compatible bucket that's **publicly readable** (R2/S3/B2/Wasabi).
3. **Try it safely first** (uploads and schedules nothing):
   ```bash
   python3 upload_and_schedule.py --dry-run
   ```
   It prints each video, its caption, and the exact publish time.
4. **Go live:**
   ```bash
   python3 upload_and_schedule.py
   ```

## Usage

| Command | What it does |
|---|---|
| `python3 upload_and_schedule.py` | schedule all new videos once |
| `--dry-run` | show the plan; upload/schedule nothing |
| `--watch` | keep watching the folder (re-scan every 5 min; `--interval N`) |
| `--list` | list everything already scheduled |

- **Captions:** by default the file name is the caption (`Sunset drone loop.mp4`
  → "Sunset drone loop"). Set `caption_from_filename = false` and a
  `default_caption` to use one caption for all.
- **Ordering:** videos are scheduled in file-name order.
- **After scheduling:** each file is moved to `done_path` (if set) so the folder
  shows what's left. Files are remembered by content, so renaming won't double-post.
- **Slots:** `posts_per_day` are spread evenly between `first_slot_hour` and
  `last_slot_hour`, starting `start_in_days` from now, continuing across runs.

## Run it on a schedule (optional)

- **macOS:** a `launchd` agent, or `cron`:
  `*/30 * * * * cd /path/desktop-uploader && /usr/bin/python3 upload_and_schedule.py`
- **Windows:** Task Scheduler running the same command.
- Or just leave `--watch` running.

## One caveat to verify

Metricool's exact scheduler request shape/auth has shifted between API versions.
Everything is isolated in `metricool.py` (`_auth_params()` and `build_payload()`).
If a real call is rejected, check the shape against the live docs at
<https://app.metricool.com/resources/apidocs/index.html> and adjust those two
functions. `--dry-run` never calls Metricool, so you can always test the folder +
scheduling logic offline.
