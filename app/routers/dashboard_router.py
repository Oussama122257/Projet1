from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import User, ScrapeJob, GeneratedPost, ScrapedPost
from app.auth import get_current_user

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


@router.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return RedirectResponse("/dashboard")


@router.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Stats
    jobs_result = await db.execute(
        select(func.count(ScrapeJob.id)).where(ScrapeJob.user_id == user.id)
    )
    total_jobs = jobs_result.scalar() or 0

    posts_result = await db.execute(
        select(func.count(ScrapedPost.id))
        .join(ScrapeJob)
        .where(ScrapeJob.user_id == user.id)
    )
    total_scraped = posts_result.scalar() or 0

    gen_result = await db.execute(
        select(func.count(GeneratedPost.id)).where(GeneratedPost.user_id == user.id)
    )
    total_generated = gen_result.scalar() or 0

    posted_result = await db.execute(
        select(func.count(GeneratedPost.id)).where(
            GeneratedPost.user_id == user.id, GeneratedPost.is_posted == True
        )
    )
    total_posted = posted_result.scalar() or 0

    # Recent jobs
    recent_jobs_result = await db.execute(
        select(ScrapeJob)
        .where(ScrapeJob.user_id == user.id)
        .order_by(ScrapeJob.created_at.desc())
        .limit(10)
    )
    recent_jobs = recent_jobs_result.scalars().all()

    return templates.TemplateResponse("pages/dashboard.html", {
        "request": request,
        "user": user,
        "stats": {
            "total_jobs": total_jobs,
            "total_scraped": total_scraped,
            "total_generated": total_generated,
            "total_posted": total_posted,
        },
        "recent_jobs": recent_jobs,
    })
