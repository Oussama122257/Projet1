"""Send Telegram notifications about bot activity."""

import requests
from config import Config


class TelegramNotifier:
    API_URL = "https://api.telegram.org/bot{token}/sendMessage"

    def __init__(self):
        self.token = Config.TELEGRAM_BOT_TOKEN
        self.chat_id = Config.TELEGRAM_CHAT_ID
        self.enabled = bool(self.token and self.chat_id)
        if not self.enabled:
            print("[Telegram] WARNING: Telegram not configured. Notifications disabled.")

    def send(self, message: str) -> bool:
        """Send a message to the configured Telegram chat."""
        if not self.enabled:
            print(f"[Telegram] SKIPPED: {message[:80]}...")
            return False

        url = self.API_URL.format(token=self.token)
        payload = {
            "chat_id": self.chat_id,
            "text": message,
            "parse_mode": "Markdown",
        }
        try:
            resp = requests.post(url, json=payload, timeout=15)
            resp.raise_for_status()
            print("[Telegram] Notification sent!")
            return True
        except requests.RequestException as e:
            print(f"[Telegram] Failed to send: {e}")
            return False

    def notify_scrape_complete(self, profile: dict, post_count: int):
        msg = (
            f"🔍 *Scrape Complete*\n\n"
            f"👤 @{profile['username']} ({profile.get('full_name', '')})\n"
            f"👥 Followers: {profile.get('followers', 0)}\n"
            f"📝 Posts scraped: {post_count}\n"
            f"✅ Verified: {profile.get('is_verified', False)}"
        )
        self.send(msg)

    def notify_ai_complete(self, provider: str, idea_count: int):
        msg = (
            f"🤖 *AI Generation Complete*\n\n"
            f"Provider: {provider}\n"
            f"Post ideas generated: {idea_count}"
        )
        self.send(msg)

    def notify_posted(self, post_count: int):
        msg = f"📤 *Posted to Threads*\n\nSuccessfully posted {post_count} threads!"
        self.send(msg)

    def notify_export(self, files: list[str]):
        file_list = "\n".join(f"  • `{f}`" for f in files)
        msg = f"📁 *Export Complete*\n\nFiles:\n{file_list}"
        self.send(msg)

    def notify_error(self, error: str):
        msg = f"❌ *Error*\n\n`{error}`"
        self.send(msg)
