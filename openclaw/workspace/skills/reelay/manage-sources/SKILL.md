---
name: reelay-manage-sources
description: List, add, pause, and resume the Instagram source accounts Reelay scrapes hourly.
---

# Reelay — manage source accounts

Source accounts are the Instagram profiles Reelay scans every hour. Use this skill
when the user wants to see them or change which are active.

**List sources** (id, handle, status, proxy group) with the `exec` tool:

```
reelayctl sources
```

**Add a source**, optionally on a proxy group and routed to destination account ids:

```
reelayctl add-source <username> --proxy eu-res-01 --to 1 2
```

**Pause / resume** scanning for a source by its id:

```
reelayctl pause-source <source_id>
reelayctl resume-source <source_id>
```

Prefer referring to accounts by handle when talking to the user, but pass the
numeric id to the CLI (get it from `reelayctl sources`). If a source is
rate-limited, explain it auto-cools down and rotates proxy; pausing stops scans
entirely. Only call `reelayctl`.
