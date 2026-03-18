"""REST API endpoints for scraping, AI, posting, export."""

import datetime
from fastapi import APIRouter, Depends, Request, Form, BackgroundTasks
from fastapi.responses import HTMLResponse, RedirectResponse, Response
from fastapi.templating import Jinja2Templates
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, async_session
from app.models import User, ScrapeJob, ScrapedPost, GeneratedPost
from app.auth import get_current_user
from app.config import settings
from app.services.scraper import ThreadsScraper
from app.services.ai_generator import generate_content
from app.services.poster import post_to_threads
from app.services.telegram import send_telegram
from app.services.exporter import generate_csv_bytes

router = APIRouter(prefix="/api")
templates = Jinja2Templates(directory="app/templates")


async def _run_scrape(job_id: int, username: str, max_posts: int, api_key: str):
    """Background task: run a scrape job."""
    async with async_session() as db:
        job = await db.get(ScrapeJob, job_id)
        if not job:
            return
        job.status = "running"
        await db.commit()

        try:
            scraper = ThreadsScraper(api_key=api_key)
            data = await scraper.scrape_profile(username, max_posts)

            job.profile_data = data["profile"]
            job.posts_count = len(data["posts"])

            for p in data["posts"]:
                db.add(ScrapedPost(
                    job_id=job.id,
                    post_id=p.get("post_id", ""),
                    text=p.get("text", ""),
                    like_count=p.get("like_count", 0),
                    reply_count=p.get("reply_count", 0),
                    repost_count=p.get("repost_count", 0),
                    posted_at=str(p.get("posted_at", "")),
                    media_type=p.get("media_type", "text"),
                    url=p.get("url", ""),
                ))

            job.status = "completed"
            job.completed_at = datetime.datetime.utcnow()
        except Exception as e:
            job.status = "failed"
            job.error_message = str(e)

        await db.commit()


# ── Scraper Page ──

@router.get("/scraper", response_class=HTMLResponse)
async def scraper_page(request: Request, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ScrapeJob).where(ScrapeJob.user_id == user.id).order_by(ScrapeJob.created_at.desc()).limit(20)
    )
    jobs = result.scalars().all()
    return templates.TemplateResponse("pages/scraper.html", {"request": request, "user": user, "jobs": jobs})


@router.post("/scraper/run")
async def run_scrape(
    background_tasks: BackgroundTasks,
    username: str = Form(...),
    max_posts: int = Form(50),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    job = ScrapeJob(user_id=user.id, target_username=username, status="pending")
    db.add(job)
    await db.commit()
    await db.refresh(job)

    api_key = user.rapidapi_key or settings.RAPIDAPI_KEY
    background_tasks.add_task(_run_scrape, job.id, username, max_posts, api_key)

    # Telegram notify
    tg_token = user.telegram_bot_token or settings.TELEGRAM_BOT_TOKEN
    tg_chat = user.telegram_chat_id or settings.TELEGRAM_CHAT_ID
    if tg_token and tg_chat:
        await send_telegram(tg_token, tg_chat, f"🔍 Started scraping @{username}...")

    return RedirectResponse("/api/scraper", status_code=303)


@router.get("/scraper/job/{job_id}", response_class=HTMLResponse)
async def job_detail(request: Request, job_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    job = await db.get(ScrapeJob, job_id)
    if not job or job.user_id != user.id:
        return RedirectResponse("/api/scraper", status_code=303)

    posts_result = await db.execute(
        select(ScrapedPost).where(ScrapedPost.job_id == job.id).order_by(ScrapedPost.like_count.desc())
    )
    posts = posts_result.scalars().all()

    gen_result = await db.execute(
        select(GeneratedPost).where(GeneratedPost.job_id == job.id)
    )
    generated = gen_result.scalars().all()

    return templates.TemplateResponse("pages/job_detail.html", {
        "request": request, "user": user, "job": job, "posts": posts, "generated": generated,
    })


# ── AI Generation ──

@router.get("/generate", response_class=HTMLResponse)
async def generate_page(request: Request, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ScrapeJob).where(ScrapeJob.user_id == user.id, ScrapeJob.status == "completed")
        .order_by(ScrapeJob.created_at.desc())
    )
    jobs = result.scalars().all()

    gen_result = await db.execute(
        select(GeneratedPost).where(GeneratedPost.user_id == user.id).order_by(GeneratedPost.created_at.desc()).limit(20)
    )
    generated = gen_result.scalars().all()

    return templates.TemplateResponse("pages/generate.html", {
        "request": request, "user": user, "jobs": jobs, "generated": generated,
    })


@router.post("/generate/run")
async def run_generate(
    job_id: int = Form(...),
    provider: str = Form("anthropic"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    job = await db.get(ScrapeJob, job_id)
    if not job or job.user_id != user.id:
        return RedirectResponse("/api/generate", status_code=303)

    posts_result = await db.execute(select(ScrapedPost).where(ScrapedPost.job_id == job.id))
    posts = posts_result.scalars().all()
    posts_data = [{"text": p.text, "like_count": p.like_count, "reply_count": p.reply_count} for p in posts]

    api_keys = {"anthropic": user.anthropic_key, "openai": user.openai_key, "gemini": user.gemini_key}
    fallback = {"anthropic": settings.ANTHROPIC_API_KEY, "openai": settings.OPENAI_API_KEY, "gemini": settings.GEMINI_API_KEY}
    api_key = api_keys.get(provider) or fallback.get(provider, "")

    result = await generate_content(provider, api_key, job.profile_data or {}, posts_data)

    for idea in result.get("post_ideas", []):
        db.add(GeneratedPost(
            user_id=user.id,
            job_id=job.id,
            ai_provider=provider,
            title=idea.get("title", ""),
            text=idea.get("text", ""),
            analysis=result.get("analysis", ""),
        ))
    await db.commit()

    tg_token = user.telegram_bot_token or settings.TELEGRAM_BOT_TOKEN
    tg_chat = user.telegram_chat_id or settings.TELEGRAM_CHAT_ID
    if tg_token and tg_chat:
        await send_telegram(tg_token, tg_chat,
            f"🤖 AI generated {len(result.get('post_ideas', []))} posts for @{job.target_username}")

    return RedirectResponse(f"/api/scraper/job/{job.id}", status_code=303)


# ── Posting ──

@router.post("/post/{post_id}")
async def post_thread(post_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    gen_post = await db.get(GeneratedPost, post_id)
    if not gen_post or gen_post.user_id != user.id:
        return RedirectResponse("/api/generate", status_code=303)

    token = user.threads_token or settings.THREADS_ACCESS_TOKEN
    uid = user.threads_user_id or settings.THREADS_USER_ID

    result = await post_to_threads(token, uid, gen_post.text)
    if result:
        gen_post.is_posted = True
        gen_post.posted_at = datetime.datetime.utcnow()
        gen_post.threads_post_id = str(result.get("id", ""))
        await db.commit()

        tg_token = user.telegram_bot_token or settings.TELEGRAM_BOT_TOKEN
        tg_chat = user.telegram_chat_id or settings.TELEGRAM_CHAT_ID
        if tg_token and tg_chat:
            await send_telegram(tg_token, tg_chat, f"📤 Posted to Threads: {gen_post.text[:100]}...")

    return RedirectResponse(f"/api/generate", status_code=303)


# ── Export ──

@router.get("/export/job/{job_id}/posts")
async def export_job_posts(job_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    job = await db.get(ScrapeJob, job_id)
    if not job or job.user_id != user.id:
        return Response("Not found", status_code=404)

    result = await db.execute(select(ScrapedPost).where(ScrapedPost.job_id == job.id))
    posts = result.scalars().all()
    data = [{"post_id": p.post_id, "text": p.text, "likes": p.like_count,
             "replies": p.reply_count, "reposts": p.repost_count, "posted_at": p.posted_at,
             "media_type": p.media_type, "url": p.url} for p in posts]

    csv_bytes = generate_csv_bytes(data)
    return Response(
        csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=posts_{job.target_username}.csv"},
    )


@router.get("/export/job/{job_id}/ai")
async def export_job_ai(job_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    job = await db.get(ScrapeJob, job_id)
    if not job or job.user_id != user.id:
        return Response("Not found", status_code=404)

    result = await db.execute(select(GeneratedPost).where(GeneratedPost.job_id == job.id))
    posts = result.scalars().all()
    data = [{"title": p.title, "text": p.text, "provider": p.ai_provider,
             "posted": p.is_posted, "analysis": p.analysis} for p in posts]

    csv_bytes = generate_csv_bytes(data)
    return Response(
        csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=ai_{job.target_username}.csv"},
    )


# ── Settings ──

@router.get("/settings", response_class=HTMLResponse)
async def settings_page(request: Request, user: User = Depends(get_current_user)):
    return templates.TemplateResponse("pages/settings.html", {"request": request, "user": user})


@router.post("/settings")
async def save_settings(
    request: Request,
    rapidapi_key: str = Form(""),
    anthropic_key: str = Form(""),
    openai_key: str = Form(""),
    gemini_key: str = Form(""),
    threads_token: str = Form(""),
    threads_user_id: str = Form(""),
    telegram_bot_token: str = Form(""),
    telegram_chat_id: str = Form(""),
    default_ai_provider: str = Form("anthropic"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user.rapidapi_key = rapidapi_key
    user.anthropic_key = anthropic_key
    user.openai_key = openai_key
    user.gemini_key = gemini_key
    user.threads_token = threads_token
    user.threads_user_id = threads_user_id
    user.telegram_bot_token = telegram_bot_token
    user.telegram_chat_id = telegram_chat_id
    user.default_ai_provider = default_ai_provider
    await db.commit()
    return templates.TemplateResponse("pages/settings.html", {
        "request": request, "user": user, "success": "Settings saved!"
    })
