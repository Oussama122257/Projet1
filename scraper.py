"""Threads profile and post scraper using RapidAPI."""

import requests
from config import Config


class ThreadsScraper:
    BASE_URL = f"https://{Config.RAPIDAPI_HOST}"

    def __init__(self):
        self.headers = Config.rapidapi_headers()

    def get_user_profile(self, username: str) -> dict:
        """Get profile info for a Threads user."""
        url = f"{self.BASE_URL}/api/user/info"
        params = {"username": username}
        resp = requests.get(url, headers=self.headers, params=params, timeout=30)
        resp.raise_for_status()
        return resp.json()

    def get_user_posts(self, user_id: str, max_posts: int = 50) -> list[dict]:
        """Get posts from a Threads user profile."""
        url = f"{self.BASE_URL}/api/user/posts"
        params = {"user_id": user_id, "count": str(max_posts)}
        resp = requests.get(url, headers=self.headers, params=params, timeout=30)
        resp.raise_for_status()
        return resp.json()

    def get_post_details(self, post_id: str) -> dict:
        """Get detailed info for a specific post."""
        url = f"{self.BASE_URL}/api/post/details"
        params = {"post_id": post_id}
        resp = requests.get(url, headers=self.headers, params=params, timeout=30)
        resp.raise_for_status()
        return resp.json()

    def scrape_profile(self, username: str, max_posts: int = 50) -> dict:
        """Full scrape: profile info + all posts with details."""
        print(f"[Scraper] Fetching profile for @{username}...")
        profile = self.get_user_profile(username)

        user_data = profile.get("data", profile)
        user_id = str(
            user_data.get("id")
            or user_data.get("user_id")
            or user_data.get("pk")
            or ""
        )

        profile_info = {
            "username": username,
            "user_id": user_id,
            "full_name": user_data.get("full_name", ""),
            "bio": user_data.get("biography", user_data.get("bio", "")),
            "followers": user_data.get(
                "follower_count", user_data.get("followers", 0)
            ),
            "following": user_data.get(
                "following_count", user_data.get("following", 0)
            ),
            "is_verified": user_data.get("is_verified", False),
            "profile_pic_url": user_data.get("profile_pic_url", ""),
        }

        print(f"[Scraper] Fetching posts for @{username} (max {max_posts})...")
        posts_raw = self.get_user_posts(user_id, max_posts)

        posts_list = posts_raw if isinstance(posts_raw, list) else posts_raw.get(
            "data", posts_raw.get("posts", posts_raw.get("threads", []))
        )

        posts = []
        for post in posts_list:
            post_data = post.get("node", post) if isinstance(post, dict) else post
            posts.append(
                {
                    "post_id": str(
                        post_data.get("id", post_data.get("pk", ""))
                    ),
                    "text": post_data.get(
                        "text",
                        post_data.get(
                            "caption", post_data.get("content", "")
                        ),
                    ),
                    "like_count": post_data.get(
                        "like_count", post_data.get("likes", 0)
                    ),
                    "reply_count": post_data.get(
                        "reply_count", post_data.get("replies", 0)
                    ),
                    "repost_count": post_data.get("repost_count", 0),
                    "posted_at": post_data.get(
                        "taken_at",
                        post_data.get(
                            "created_at",
                            post_data.get("timestamp", ""),
                        ),
                    ),
                    "media_type": post_data.get("media_type", "text"),
                    "url": post_data.get("url", post_data.get("permalink", "")),
                }
            )

        print(f"[Scraper] Found {len(posts)} posts for @{username}")
        return {"profile": profile_info, "posts": posts}
