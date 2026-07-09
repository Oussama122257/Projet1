"""Telegram notifications and approval prompts.

Create a bot with @BotFather, put the token in TELEGRAM_BOT_TOKEN, and your
chat/channel id in TELEGRAM_CHAT_ID. Approval prompts use an inline keyboard so
you can Approve/Skip a clip straight from your phone.
"""
from __future__ import annotations

import httpx

from app.config import settings

_API = "https://api.telegram.org/bot{token}/{method}"


def _post(method: str, payload: dict) -> dict | None:
    if not settings.telegram_bot_token or not settings.telegram_chat_id:
        return None  # notifications not configured; stay silent in dev
    url = _API.format(token=settings.telegram_bot_token, method=method)
    try:
        with httpx.Client(timeout=15) as client:
            resp = client.post(url, json=payload)
            resp.raise_for_status()
            return resp.json()
    except Exception:
        return None


def notify(text: str) -> None:
    """Send a plain status message to the configured chat."""
    _post("sendMessage", {
        "chat_id": settings.telegram_chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    })


def request_approval(video_id: int, caption: str, source_username: str) -> None:
    """Send an Approve/Skip card. Callbacks are handled by the bot webhook."""
    preview = (caption or "")[:180]
    _post("sendMessage", {
        "chat_id": settings.telegram_chat_id,
        "text": f"🎬 New clip from <b>@{source_username}</b>\n{preview}",
        "parse_mode": "HTML",
        "reply_markup": {
            "inline_keyboard": [[
                {"text": "✅ Approve", "callback_data": f"approve:{video_id}"},
                {"text": "⏭ Skip", "callback_data": f"skip:{video_id}"},
            ]]
        },
    })
