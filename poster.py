"""Post content to Threads using Meta's Official Threads API."""

import time
import requests
from config import Config

THREADS_API_BASE = "https://graph.threads.net/v1.0"


class ThreadsPoster:
    def __init__(self):
        self.access_token = Config.THREADS_ACCESS_TOKEN
        self.user_id = Config.THREADS_USER_ID
        if not self.access_token or not self.user_id:
            print("[Poster] WARNING: Threads credentials not configured. Posting disabled.")

    def _create_container(self, text: str) -> str | None:
        """Create a media container for a text post."""
        url = f"{THREADS_API_BASE}/{self.user_id}/threads"
        payload = {
            "media_type": "TEXT",
            "text": text,
            "access_token": self.access_token,
        }
        resp = requests.post(url, data=payload, timeout=30)
        resp.raise_for_status()
        return resp.json().get("id")

    def _publish_container(self, container_id: str) -> dict:
        """Publish a previously created media container."""
        url = f"{THREADS_API_BASE}/{self.user_id}/threads_publish"
        payload = {
            "creation_id": container_id,
            "access_token": self.access_token,
        }
        resp = requests.post(url, data=payload, timeout=30)
        resp.raise_for_status()
        return resp.json()

    def post_text(self, text: str) -> dict | None:
        """Post a text thread. Returns the published post info."""
        if not self.access_token or not self.user_id:
            print(f"[Poster] SKIPPED (no credentials): {text[:80]}...")
            return None

        print(f"[Poster] Creating container for: {text[:60]}...")
        container_id = self._create_container(text)
        if not container_id:
            print("[Poster] Failed to create container")
            return None

        # Wait for container to be ready
        time.sleep(3)

        print(f"[Poster] Publishing container {container_id}...")
        result = self._publish_container(container_id)
        print(f"[Poster] Published! Post ID: {result.get('id')}")
        return result

    def post_multiple(self, texts: list[str], delay: int = 10) -> list[dict]:
        """Post multiple threads with a delay between each."""
        results = []
        for i, text in enumerate(texts):
            print(f"[Poster] Posting {i + 1}/{len(texts)}...")
            result = self.post_text(text)
            if result:
                results.append(result)
            if i < len(texts) - 1:
                print(f"[Poster] Waiting {delay}s before next post...")
                time.sleep(delay)
        return results
