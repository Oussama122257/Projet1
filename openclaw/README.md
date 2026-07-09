# Reelay × OpenClaw — chat-driven control

Run your Reelay pipeline by **chatting with it on Telegram**. OpenClaw is a
self-hosted gateway that connects a chat app to an AI agent; here the agent is
locked to a single safe command — `reelayctl` — so a stray message can't touch
anything else on the box.

```
You (Telegram) ──▶ OpenClaw gateway ──▶ reelay-ops agent
                                            │  (exec tool, reelayctl only)
                                            ▼
                                   reelayctl ──HTTP──▶ Reelay API ──▶ pipeline
```

## What you can say

| You type | Skill | It runs |
|---|---|---|
| "how's the pipeline?" | reelay-status | `reelayctl status` |
| "anything to approve?" | reelay-approvals | `reelayctl queue` |
| "approve 42" / "skip 42" | reelay-approvals | `reelayctl approve 42` |
| "pause @meme.motion" | reelay-manage-sources | `reelayctl pause-source <id>` |
| "add source @travel.hues on eu-res-01" | reelay-manage-sources | `reelayctl add-source ...` |
| "add my.food.page, brand 998, cap 3" | reelay-manage-destinations | `reelayctl add-destination ...` |
| "retry the failures" | reelay-manage-destinations | `reelayctl retry-failed` |

Approvals also arrive **proactively**: the pipeline sends a Telegram card with
Approve/Skip buttons when a new clip is scraped (see `services/telegram.py`).

## Layout

```
openclaw/
├── openclaw.json                 # gateway config (loopback, Telegram, scoped skills)
├── Dockerfile                    # Node + python3 + reelayctl + openclaw
└── workspace/skills/reelay/
    ├── status/SKILL.md
    ├── approvals/SKILL.md
    ├── manage-sources/SKILL.md
    └── manage-destinations/SKILL.md
```

Each `SKILL.md` is YAML frontmatter (`name`, `description`) + instructions telling
the agent when to run which `reelayctl` command.

## Setup

1. Fill `.env` (repo root): `ANTHROPIC_API_KEY`, `TELEGRAM_BOT_TOKEN`,
   `TELEGRAM_CHAT_ID`, `OPENCLAW_GATEWAY_TOKEN`.
2. Start it alongside the pipeline:
   ```bash
   docker compose --profile openclaw up --build
   ```
3. Message your Telegram bot: "status". The `reelay-ops` agent replies.

Verify skills loaded: `docker compose exec openclaw openclaw skills list`.

## Safety

- **Loopback bind** — the gateway is not exposed to the internet (`bind: loopback`).
- **One command** — the agent's system prompt + skills only ever call `reelayctl`;
  it is the sole item on `PATH` we point the agent at for pipeline actions.
- **Allowlisted chat** — only `TELEGRAM_CHAT_ID` can talk to the agent.

> OpenClaw's `exec` tool is powerful by design. Keep the agent scoped to
> `reelayctl`, don't run the gateway as root on a shared host, and confirm the
> current config keys against https://docs.openclaw.ai/gateway/configuration-reference
> — the schema evolves.
