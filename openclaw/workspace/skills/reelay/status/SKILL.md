---
name: reelay-status
description: Report Reelay pipeline health — sources, approvals, scheduled and published counts.
---

# Reelay status

Use this whenever the user asks how the pipeline is doing — "status", "how many
videos are queued", "any accounts down", "what's scheduled".

Run the scoped Reelay CLI with the `exec` tool:

```
reelayctl status
```

Relay the output back conversationally. If any accounts are cooling down or there
are failed videos, call that out first — that's what needs attention. Offer to
retry failures (`reelayctl retry-failed`) or show the approval queue
(`reelayctl queue`) if relevant.

Never run any command other than `reelayctl`. Do not use raw shell for pipeline
actions.
