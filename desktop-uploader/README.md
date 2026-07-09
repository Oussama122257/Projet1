# Instagram link → Metricool, automated

Two ways in, one way out (a scheduled Instagram Reel in Metricool):

1. **`publish_links.py`** — give it an Instagram **link**; it downloads the video via
   the **Apify** API and schedules it. Fully automated, no storage bucket needed.
2. **`upload_and_schedule.py`** — point it at a **desktop folder** of videos instead.

Both remember what they've already done, and share the same schedule + Metricool config.

---

## 1. Automated: link → Apify → Metricool  (recommended)

```
Instagram link ──▶ Apify (get video URL + caption) ──▶ Metricool normalize ──▶ schedule Reel
```

```bash
python3 publish_links.py https://www.instagram.com/reel/XXXX/
python3 publish_links.py --file links.txt          # one link per line
python3 publish_links.py --file links.txt --dry-run # preview; calls nothing
python3 publish_links.py https://.../reel/XXXX/ --now  # ~3 min out, not next slot
python3 publish_links.py --list
```

**No storage bucket required.** Metricool's `normalize` step pulls the Apify video
URL onto Metricool's own servers, so you only need two tokens: **Apify** + **Metricool**.
(If you'd rather host the file yourself, set `[media] mode = "stage"` and fill in
`[staging]` — it'll download + re-upload to your bucket first.)

You need in `config.toml`:
- `[apify]` — your Apify API token (Console → Settings → Integrations).
- `[metricool]` — token, user id, blog id (the IG profile you publish to).
- `[schedule]` — timezone, posts/day, first/last hour.

Links are de-duplicated by their shortcode, so re-running a list is safe.

---

## 2. Folder mode: desktop videos → Metricool

Point it at a folder and it schedules every new video file:

```bash
python3 upload_and_schedule.py --dry-run
python3 upload_and_schedule.py            # or --watch to keep watching
```

Folder mode **does** need staging storage, because the files are local: Metricool
can't take a file upload — it fetches media from a public, non-expiring URL. Fill in
`[folder]` and `[staging]` (Cloudflare R2 free tier works well).

## Setup

1. **Python 3.11+**, then install deps:
   ```bash
   cd desktop-uploader
   python3 -m pip install -r requirements.txt
   ```
2. **Config:** `cp config.example.toml config.toml` and fill in:
   - `[apify]` — your Apify token (needed for link mode).
   - `[metricool]` — token/user id/blog id (Advanced plan → Settings → API; the
     blog id is the Instagram profile you publish to).
   - `[schedule]` — timezone, posts per day, earliest/latest hour.
   - `[folder]` + `[staging]` — only for folder mode (an S3-compatible **publicly
     readable** bucket: R2/S3/B2/Wasabi).
3. **Try it safely first** (calls nothing):
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
