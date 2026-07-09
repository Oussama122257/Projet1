"""Reelay API — FastAPI application entrypoint."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # For the scaffold we create tables on boot. In production use Alembic migrations.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=f"{settings.app_name} API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["system"])
def health() -> dict:
    return {"status": "ok", "app": settings.app_name, "env": settings.environment}


# Routers are registered here as they are built.
from app.api import accounts, dashboard, ops, videos  # noqa: E402

app.include_router(dashboard.router)
app.include_router(accounts.router)
app.include_router(videos.router)
app.include_router(ops.router)
