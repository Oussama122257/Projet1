---
name: reelay-approvals
description: Review the Reelay approval queue and approve or skip scraped clips before they schedule.
---

# Reelay approvals

Scraped videos wait in a queue for a human decision before they schedule to
Metricool. Use this skill when the user wants to review, approve, or skip clips.

**List what's waiting** with the `exec` tool:

```
reelayctl queue
```

Each row is `#<id>  <shortcode>  <caption>`. Present them clearly and ask which to
approve or skip.

**Approve** a clip (optionally rewriting its caption):

```
reelayctl approve <video_id>
reelayctl approve <video_id> --caption "New caption text"
```

**Skip** a clip:

```
reelayctl skip <video_id>
```

Confirm each action back to the user with the video id. When approving several,
run one `approve` per id. Only ever call `reelayctl` — never raw shell.
