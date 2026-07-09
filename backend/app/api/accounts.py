"""CRUD for source accounts, destination accounts, and routing rules."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import DestinationAccount, RoutingRule, SourceAccount
from app.schemas import (
    DestinationAccountCreate,
    DestinationAccountOut,
    RoutingRuleCreate,
    RoutingRuleOut,
    SourceAccountCreate,
    SourceAccountOut,
)

router = APIRouter(prefix="/api", tags=["accounts"])


# ---------- Source accounts ----------
@router.get("/sources", response_model=list[SourceAccountOut])
def list_sources(db: Session = Depends(get_db)):
    return db.scalars(select(SourceAccount).order_by(SourceAccount.username)).all()


@router.post("/sources", response_model=SourceAccountOut, status_code=201)
def create_source(payload: SourceAccountCreate, db: Session = Depends(get_db)):
    if db.scalar(select(SourceAccount).where(SourceAccount.username == payload.username)):
        raise HTTPException(409, "That source account already exists.")
    src = SourceAccount(username=payload.username, proxy_group=payload.proxy_group)
    db.add(src)
    db.flush()
    for dest_id in payload.destination_ids:
        db.add(RoutingRule(source_id=src.id, destination_id=dest_id))
    db.commit()
    db.refresh(src)
    return src


@router.post("/sources/{source_id}/pause", response_model=SourceAccountOut)
def pause_source(source_id: int, db: Session = Depends(get_db)):
    src = db.get(SourceAccount, source_id)
    if not src:
        raise HTTPException(404, "Source account not found.")
    src.is_active = False
    db.commit()
    db.refresh(src)
    return src


@router.post("/sources/{source_id}/resume", response_model=SourceAccountOut)
def resume_source(source_id: int, db: Session = Depends(get_db)):
    src = db.get(SourceAccount, source_id)
    if not src:
        raise HTTPException(404, "Source account not found.")
    src.is_active = True
    db.commit()
    db.refresh(src)
    return src


@router.delete("/sources/{source_id}", status_code=204)
def delete_source(source_id: int, db: Session = Depends(get_db)):
    src = db.get(SourceAccount, source_id)
    if not src:
        raise HTTPException(404, "Source account not found.")
    db.delete(src)
    db.commit()


# ---------- Destination accounts ----------
@router.get("/destinations", response_model=list[DestinationAccountOut])
def list_destinations(db: Session = Depends(get_db)):
    return db.scalars(select(DestinationAccount).order_by(DestinationAccount.username)).all()


@router.post("/destinations", response_model=DestinationAccountOut, status_code=201)
def create_destination(payload: DestinationAccountCreate, db: Session = Depends(get_db)):
    if db.scalar(
        select(DestinationAccount).where(DestinationAccount.username == payload.username)
    ):
        raise HTTPException(409, "That destination account already exists.")
    dest = DestinationAccount(**payload.model_dump())
    db.add(dest)
    db.commit()
    db.refresh(dest)
    return dest


# ---------- Routing ----------
@router.get("/routes", response_model=list[RoutingRuleOut])
def list_routes(db: Session = Depends(get_db)):
    return db.scalars(select(RoutingRule)).all()


@router.post("/routes", response_model=RoutingRuleOut, status_code=201)
def create_route(payload: RoutingRuleCreate, db: Session = Depends(get_db)):
    exists = db.scalar(
        select(RoutingRule).where(
            RoutingRule.source_id == payload.source_id,
            RoutingRule.destination_id == payload.destination_id,
        )
    )
    if exists:
        raise HTTPException(409, "That route already exists.")
    rule = RoutingRule(**payload.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule
