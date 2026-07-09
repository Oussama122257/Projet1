# Reelay — UI/UX Spec

Companion to `ROADMAP.md`. The interactive mockup lives at
`design/dashboard-mockup.html` (open it in a browser — it's theme-aware with a live
scan countdown).

## Product name & voice
**Reelay** — "content relay." Voice is calm and operational: controls say exactly
what they do (**Publish**, then a "Published" toast), errors say what broke and how
to fix it. People manage *notifications* and *source accounts*, never "webhook config."

## Design language
- **Accent:** coral-magenta `#ff5c8a` — the Instagram nod, used only for primary
  actions and the "scheduled" stage. Never the whole UI.
- **Flow color:** teal `#38d6c4` for the automation/pipeline layer.
- **Semantic (separate from accent):** green = healthy/published, amber = cooldown,
  red = rate-limited/failed. State is always shown as a **pill + color**, never color
  alone, so it's readable at a glance and accessible.
- **Neutrals:** plum-biased greys, not pure grey. Full light + dark themes.
- **Type:** system sans for UI, monospace for all counts/timestamps with tabular
  numerals so columns line up.

## Screens (build these, in order)

### 1. Overview (the mockup)
The home. Above the fold: **the pipeline**, rendered as the 5 real stages —
Scan → Download → Drive → Schedule → Publish — each with a live count so you see
where content is *right now*. Below: a stat row (videos today, scheduled runway,
published this week, proxy health) then two panels — **source-account health** and a
**Telegram activity feed** + **next-up queue**. Summary before detail; the one thing
that needs attention (a rate-limited account) reads instantly via the red pill.

### 2. Source accounts
Table of accounts you scrape. Columns: account, status pill, last scan, new videos
(24h), proxy group, daily cap. Row actions: pause/resume, force scan, view history.
Bulk import via paste/CSV. **Add-account** modal: username + proxy group + which
destinations it feeds (routing).

### 3. Content library
Grid of downloaded videos (Reel-shaped 9:16 thumbs). Filters: source, status
(new / approved / scheduled / published), date, duplicate flag. Each card: preview,
source, perceptual-hash dedupe badge, caption, and **Approve / Skip / Edit caption**.
This is the human review gate before anything schedules.

### 4. Schedule
Calendar (week/day) of what publishes when, grouped by destination account. Drag to
reslot; per-account daily caps visualized (so you never look bot-like). Shows the
Metricool sync status per post.

### 5. Destinations
Your publishing Instagram accounts. Each: connected Metricool brand, timezone,
posting cadence/slots, daily cap, and which sources feed it.

### 6. Notifications
Configure the Telegram channel: which events alert (scrape fail, ban, quota, digest,
approval requests), quiet hours, and the daily digest time.

### 7. Settings
Google Drive connection, Metricool API token, proxy providers, OpenClaw control
channel, billing (if SaaS).

## Key interaction principles
- **Approvals happen where you already are** — inline in the library *and* as
  Telegram inline-keyboard cards, so you can approve from your phone.
- **State encoded in form, not just number** — pills, severity color, the pulsing
  "next scan" indicator.
- **Nothing silently fails** — a rate-limited account surfaces on Overview, in the
  table, and in Telegram, with the auto-cooldown action shown.
- **Empty & first-run states** — first screen after signup is "Add your first source
  account," not an empty dashboard.

## Responsive
Sidebar collapses under 1080px; stat and pipeline grids reflow to 2-up then 1-up.
Body never scrolls sideways — wide tables scroll inside their own container.
