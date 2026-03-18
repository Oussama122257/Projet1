import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # RapidAPI
    RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY", "")
    RAPIDAPI_HOST = os.getenv("RAPIDAPI_HOST", "threads-api4.p.rapidapi.com")

    # AI Providers
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    AI_PROVIDER = os.getenv("AI_PROVIDER", "anthropic")

    # Threads Posting (Meta Official API)
    THREADS_ACCESS_TOKEN = os.getenv("THREADS_ACCESS_TOKEN", "")
    THREADS_USER_ID = os.getenv("THREADS_USER_ID", "")

    # Telegram
    TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

    # Output
    CSV_OUTPUT_DIR = os.getenv("CSV_OUTPUT_DIR", "./output")

    @classmethod
    def rapidapi_headers(cls):
        return {
            "x-rapidapi-key": cls.RAPIDAPI_KEY,
            "x-rapidapi-host": cls.RAPIDAPI_HOST,
        }
