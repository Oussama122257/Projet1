# Threads Scraper Bot

A Python bot that scrapes Threads profiles/posts via RapidAPI, generates AI content (Claude/OpenAI/Gemini), posts to Threads, exports to CSV, and sends Telegram notifications.

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
```

## Usage

```bash
# Scrape profile + AI analysis + export to CSV
python bot.py scrape zuck

# Full pipeline (scrape + AI + post + export + notify)
python bot.py full zuck --ai anthropic

# Export only (no AI, no posting)
python bot.py export zuck --posts 100

# Scrape with options
python bot.py scrape zuck --posts 30 --ai openai --post --no-notify
```

## Configuration (.env)

| Variable | Description |
|---|---|
| `RAPIDAPI_KEY` | RapidAPI key for Threads API |
| `ANTHROPIC_API_KEY` | Claude API key |
| `OPENAI_API_KEY` | OpenAI API key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `AI_PROVIDER` | Default AI: `anthropic`, `openai`, or `gemini` |
| `THREADS_ACCESS_TOKEN` | Meta Threads API access token |
| `THREADS_USER_ID` | Your Threads user ID |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token |
| `TELEGRAM_CHAT_ID` | Telegram chat ID for notifications |

## Modules

- **scraper.py** - Scrapes Threads profiles and posts via RapidAPI
- **ai_generator.py** - Generates content with Claude, OpenAI, or Gemini
- **poster.py** - Posts to Threads via Meta's official API
- **exporter.py** - Exports data to CSV files
- **notifier.py** - Sends Telegram notifications
- **bot.py** - Main orchestrator and CLI
