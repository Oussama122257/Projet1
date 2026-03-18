import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # API keys stored per user
    rapidapi_key = Column(String(256), default="")
    anthropic_key = Column(String(256), default="")
    openai_key = Column(String(256), default="")
    gemini_key = Column(String(256), default="")
    threads_token = Column(String(512), default="")
    threads_user_id = Column(String(64), default="")
    telegram_bot_token = Column(String(256), default="")
    telegram_chat_id = Column(String(64), default="")
    default_ai_provider = Column(String(20), default="anthropic")

    scrape_jobs = relationship("ScrapeJob", back_populates="user")
    generated_posts = relationship("GeneratedPost", back_populates="user")


class ScrapeJob(Base):
    __tablename__ = "scrape_jobs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_username = Column(String(100), nullable=False)
    status = Column(String(20), default="pending")  # pending, running, completed, failed
    error_message = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Profile data
    profile_data = Column(JSON, default=dict)
    posts_count = Column(Integer, default=0)

    user = relationship("User", back_populates="scrape_jobs")
    scraped_posts = relationship("ScrapedPost", back_populates="job", cascade="all, delete-orphan")
    generated_posts = relationship("GeneratedPost", back_populates="job", cascade="all, delete-orphan")


class ScrapedPost(Base):
    __tablename__ = "scraped_posts"

    id = Column(Integer, primary_key=True)
    job_id = Column(Integer, ForeignKey("scrape_jobs.id"), nullable=False)
    post_id = Column(String(64), default="")
    text = Column(Text, default="")
    like_count = Column(Integer, default=0)
    reply_count = Column(Integer, default=0)
    repost_count = Column(Integer, default=0)
    posted_at = Column(String(64), default="")
    media_type = Column(String(20), default="text")
    url = Column(String(512), default="")

    job = relationship("ScrapeJob", back_populates="scraped_posts")


class GeneratedPost(Base):
    __tablename__ = "generated_posts"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("scrape_jobs.id"), nullable=True)
    ai_provider = Column(String(20), default="")
    title = Column(String(256), default="")
    text = Column(Text, default="")
    analysis = Column(Text, default="")
    is_posted = Column(Boolean, default=False)
    posted_at = Column(DateTime, nullable=True)
    threads_post_id = Column(String(64), default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="generated_posts")
    job = relationship("ScrapeJob", back_populates="generated_posts")


class ScheduledTask(Base):
    __tablename__ = "scheduled_tasks"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    task_type = Column(String(30), nullable=False)  # scrape, generate, post
    target_username = Column(String(100), default="")
    cron_expression = Column(String(50), default="")
    is_active = Column(Boolean, default=True)
    last_run = Column(DateTime, nullable=True)
    next_run = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
