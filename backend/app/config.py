"""Central configuration, loaded from environment variables.

Every secret and tunable lives here so nothing is hard-coded in the app.
Copy `.env.example` to `.env` and fill in real values.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- Core ---
    app_name: str = "Reelay"
    environment: str = "development"
    secret_key: str = "change-me"

    # --- Database / queue ---
    database_url: str = "postgresql+psycopg2://reelay:reelay@postgres:5432/reelay"
    redis_url: str = "redis://redis:6379/0"

    # --- Pipeline behaviour ---
    scan_interval_minutes: int = 60          # "scan every 1H"
    scan_jitter_seconds: int = 1800          # spread scans across the hour to look human
    max_downloads_per_scan: int = 20
    default_daily_cap: int = 4               # posts/day per destination account

    # --- Google Drive ---
    google_service_account_file: str = "/secrets/gdrive.json"
    gdrive_root_folder_id: str = ""

    # --- Metricool ---
    metricool_api_token: str = ""
    metricool_user_id: str = ""
    metricool_base_url: str = "https://app.metricool.com/api"

    # --- Telegram ---
    telegram_bot_token: str = ""
    telegram_chat_id: str = ""

    # --- Media staging (Metricool needs a reachable URL) ---
    media_public_base_url: str = ""          # e.g. https://cdn.yourdomain.com


@lru_cache
def get_settings() -> "Settings":
    return Settings()


settings = get_settings()
