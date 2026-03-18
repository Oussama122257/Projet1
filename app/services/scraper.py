"""Threads scraper service using RapidAPI."""

import httpx
from app.config import settings


class ThreadsScraper:
    def __init__(self, api_key: str = "", api_host: str = ""):
        self.api_key = api_key or settings.RAPIDAPI_KEY
        self.api_host = api_host or settings.RAPIDAPI_HOST
        self.base_url = f"https://{self.api_host}"
        self.headers = {
            "x-rapidapi-key": self.api_key,
            "x-rapidapi-host": self.api_host,
        }

    async def get_user_profile(self, username: str) -> dict:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                f"{self.base_url}/api/user/info",
                headers=self.headers,
                params={"username": username},
            )
            resp.raise_for_status()
            return resp.json()

    async def get_user_posts(self, user_id: str, count: int = 50) -> list:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                f"{self.base_url}/api/user/posts",
                headers=self.headers,
                params={"user_id": user_id, "count": str(count)},
            )
            resp.raise_for_status()
            return resp.json()

    async def get_post_details(self, post_id: str) -> dict:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                f"{self.base_url}/api/post/details",
                headers=self.headers,
                params={"post_id": post_id},
            )
            resp.raise_for_status()
            return resp.json()

    async def scrape_profile(self, username: str, max_posts: int = 50) -> dict:
        profile_raw = await self.get_user_profile(username)
        user_data = profile_raw.get("data", profile_raw)

        user_id = str(
            user_data.get("id")
            or user_data.get("user_id")
            or user_data.get("pk")
            or ""
        )

        profile = {
            "username": username,
            "user_id": user_id,
            "full_name": user_data.get("full_name", ""),
            "bio": user_data.get("biography", user_data.get("bio", "")),
            "followers": user_data.get("follower_count", user_data.get("followers", 0)),
            "following": user_data.get("following_count", user_data.get("following", 0)),
            "is_verified": user_data.get("is_verified", False),
            "profile_pic_url": user_data.get("profile_pic_url", ""),
        }

        posts_raw = await self.get_user_posts(user_id, max_posts)
        posts_list = (
            posts_raw if isinstance(posts_raw, list)
            else posts_raw.get("data", posts_raw.get("posts", posts_raw.get("threads", [])))
        )

        posts = []
        for post in posts_list:
            p = post.get("node", post) if isinstance(post, dict) else post
            posts.append({
                "post_id": str(p.get("id", p.get("pk", ""))),
                "text": p.get("text", p.get("caption", p.get("content", ""))),
                "like_count": p.get("like_count", p.get("likes", 0)),
                "reply_count": p.get("reply_count", p.get("replies", 0)),
                "repost_count": p.get("repost_count", 0),
                "posted_at": p.get("taken_at", p.get("created_at", p.get("timestamp", ""))),
                "media_type": p.get("media_type", "text"),
                "url": p.get("url", p.get("permalink", "")),
            })

        return {"profile": profile, "posts": posts}
