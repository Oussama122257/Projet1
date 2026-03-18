#!/usr/bin/env python3
"""
Threads Scraper Bot - Main orchestrator.

Scrapes Threads profiles, generates AI content, posts to Threads,
exports to CSV, and sends Telegram notifications.

Usage:
    python bot.py scrape <username> [--posts 50] [--ai anthropic] [--post] [--export] [--notify]
    python bot.py full <username>    # Run full pipeline
    python bot.py export <username>  # Scrape + export only
"""

import argparse
import sys
import traceback

from scraper import ThreadsScraper
from ai_generator import generate_content
from poster import ThreadsPoster
from exporter import CSVExporter
from notifier import TelegramNotifier
from config import Config


def run_pipeline(
    username: str,
    max_posts: int = 50,
    ai_provider: str = None,
    do_ai: bool = True,
    do_post: bool = False,
    do_export: bool = True,
    do_notify: bool = True,
):
    """Run the full bot pipeline."""
    notifier = TelegramNotifier()
    provider = ai_provider or Config.AI_PROVIDER

    try:
        # 1. Scrape
        print("=" * 60)
        print(f"  THREADS SCRAPER BOT - @{username}")
        print("=" * 60)

        scraper = ThreadsScraper()
        scraped = scraper.scrape_profile(username, max_posts)
        profile = scraped["profile"]
        posts = scraped["posts"]

        print(f"\n  Profile: {profile['full_name']} (@{profile['username']})")
        print(f"  Followers: {profile['followers']} | Following: {profile['following']}")
        print(f"  Posts scraped: {len(posts)}\n")

        if do_notify:
            notifier.notify_scrape_complete(profile, len(posts))

        # 2. AI Generation
        ai_result = {}
        if do_ai and posts:
            print("-" * 60)
            ai_result = generate_content(profile, posts, provider)

            analysis = ai_result.get("analysis", "")
            ideas = ai_result.get("post_ideas", [])
            print(f"\n  AI Analysis: {analysis[:200]}...")
            print(f"  Generated {len(ideas)} post ideas\n")

            for i, idea in enumerate(ideas, 1):
                print(f"  [{i}] {idea.get('title', 'Untitled')}")
                print(f"      {idea.get('text', '')[:100]}...\n")

            if do_notify:
                notifier.notify_ai_complete(provider, len(ideas))

        # 3. Post to Threads
        if do_post and ai_result.get("post_ideas"):
            print("-" * 60)
            poster = ThreadsPoster()
            texts = [idea["text"] for idea in ai_result["post_ideas"] if idea.get("text")]
            results = poster.post_multiple(texts)
            print(f"\n  Posted {len(results)} threads\n")

            if do_notify:
                notifier.notify_posted(len(results))

        # 4. Export to CSV
        exported_files = []
        if do_export:
            print("-" * 60)
            exporter = CSVExporter()
            exported_files = exporter.export_all(scraped, ai_result)
            print(f"\n  Exported {len(exported_files)} files\n")

            if do_notify:
                notifier.notify_export(exported_files)

        print("=" * 60)
        print("  DONE!")
        print("=" * 60)

        return {
            "profile": profile,
            "posts": posts,
            "ai_result": ai_result,
            "exported_files": exported_files,
        }

    except Exception as e:
        error_msg = f"{type(e).__name__}: {e}"
        print(f"\n[ERROR] {error_msg}")
        traceback.print_exc()
        if do_notify:
            notifier.notify_error(error_msg)
        raise


def main():
    parser = argparse.ArgumentParser(
        description="Threads Scraper Bot - Scrape, analyze, post, export, notify"
    )
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # scrape command
    scrape_parser = subparsers.add_parser("scrape", help="Scrape a Threads profile")
    scrape_parser.add_argument("username", help="Threads username to scrape")
    scrape_parser.add_argument("--posts", type=int, default=50, help="Max posts to scrape")
    scrape_parser.add_argument("--ai", default=None, help="AI provider: anthropic/openai/gemini")
    scrape_parser.add_argument("--no-ai", action="store_true", help="Skip AI generation")
    scrape_parser.add_argument("--post", action="store_true", help="Post AI content to Threads")
    scrape_parser.add_argument("--no-export", action="store_true", help="Skip CSV export")
    scrape_parser.add_argument("--no-notify", action="store_true", help="Skip Telegram notification")

    # full command
    full_parser = subparsers.add_parser("full", help="Run full pipeline")
    full_parser.add_argument("username", help="Threads username")
    full_parser.add_argument("--posts", type=int, default=50)
    full_parser.add_argument("--ai", default=None)

    # export command
    export_parser = subparsers.add_parser("export", help="Scrape and export only")
    export_parser.add_argument("username", help="Threads username")
    export_parser.add_argument("--posts", type=int, default=50)

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    if args.command == "scrape":
        run_pipeline(
            username=args.username,
            max_posts=args.posts,
            ai_provider=args.ai,
            do_ai=not args.no_ai,
            do_post=args.post,
            do_export=not args.no_export,
            do_notify=not args.no_notify,
        )
    elif args.command == "full":
        run_pipeline(
            username=args.username,
            max_posts=args.posts,
            ai_provider=args.ai,
            do_ai=True,
            do_post=True,
            do_export=True,
            do_notify=True,
        )
    elif args.command == "export":
        run_pipeline(
            username=args.username,
            max_posts=args.posts,
            do_ai=False,
            do_post=False,
            do_export=True,
            do_notify=False,
        )


if __name__ == "__main__":
    main()
