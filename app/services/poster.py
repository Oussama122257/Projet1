"""Threads posting service via Meta's Official API."""

import asyncio
import httpx

THREADS_API = "https://graph.threads.net/v1.0"


async def post_to_threads(access_token: str, user_id: str, text: str) -> dict | None:
    if not access_token or not user_id:
        return None

    async with httpx.AsyncClient(timeout=30) as client:
        # Create container
        resp = await client.post(
            f"{THREADS_API}/{user_id}/threads",
            data={"media_type": "TEXT", "text": text, "access_token": access_token},
        )
        resp.raise_for_status()
        container_id = resp.json().get("id")
        if not container_id:
            return None

        await asyncio.sleep(3)

        # Publish
        resp = await client.post(
            f"{THREADS_API}/{user_id}/threads_publish",
            data={"creation_id": container_id, "access_token": access_token},
        )
        resp.raise_for_status()
        return resp.json()
