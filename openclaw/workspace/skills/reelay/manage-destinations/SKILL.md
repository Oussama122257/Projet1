---
name: reelay-manage-destinations
description: Add Reelay destination accounts (your publishing IG accounts) and retry failed videos.
---

# Reelay — destinations & recovery

Destination accounts are the Instagram accounts Reelay publishes to, via Metricool.
Each maps to a Metricool "brand" id and has a daily posting cap.

**Add a destination** with the `exec` tool:

```
reelayctl add-destination <username> --brand <metricool_brand_id> --cap 3
```

`--cap` is posts per day (keep it human, 1–4). The brand id comes from Metricool.

**Retry failed videos** (re-queues anything stuck in the failed state):

```
reelayctl retry-failed
```

Confirm the result back to the user. Only ever call `reelayctl` — never raw shell.
