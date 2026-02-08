from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from backend.auth import get_current_user
from backend.db import models

router = APIRouter()


class TranslateRequest(BaseModel):
    word: str


class CardCreateRequest(BaseModel):
    korean: str
    english: str
    example_kr: str | None = None
    example_en: str | None = None


class CardUpdateRequest(BaseModel):
    english: str | None = None
    example_kr: str | None = None
    example_en: str | None = None


@router.post("/translate")
async def translate_word(
    body: TranslateRequest,
    request: Request,
    user: dict[str, Any] = Depends(get_current_user),
):
    """Translate a Korean word using AI."""
    llm = request.app.state.llm
    try:
        result = await llm.translate_korean(body.word)
        return result.model_dump()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")


@router.post("")
async def create_card(
    body: CardCreateRequest,
    request: Request,
    user: dict[str, Any] = Depends(get_current_user),
):
    """Save a new flashcard."""
    db = request.app.state.db
    user_id = user["id"]

    # Check for duplicate
    if await models.check_duplicate(db, user_id, body.korean):
        raise HTTPException(status_code=400, detail="You already have a card for this word")

    card_id = await models.add_flashcard(
        db, user_id, body.korean, body.english, body.example_kr, body.example_en
    )
    card = await models.get_flashcard_by_id(db, card_id, user_id)
    return card


@router.get("")
async def list_cards(
    request: Request,
    page: int = 1,
    per_page: int = 10,
    user: dict[str, Any] = Depends(get_current_user),
):
    """List user's flashcards with pagination."""
    db = request.app.state.db
    user_id = user["id"]
    offset = (page - 1) * per_page

    cards, total = await models.get_all_flashcards(db, user_id, offset, per_page)
    total_pages = (total + per_page - 1) // per_page

    return {
        "cards": cards,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
    }


@router.get("/{card_id}")
async def get_card(
    card_id: int,
    request: Request,
    user: dict[str, Any] = Depends(get_current_user),
):
    """Get a single flashcard."""
    db = request.app.state.db
    card = await models.get_flashcard_by_id(db, card_id, user["id"])
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card


@router.put("/{card_id}")
async def update_card(
    card_id: int,
    body: CardUpdateRequest,
    request: Request,
    user: dict[str, Any] = Depends(get_current_user),
):
    """Update a flashcard's editable fields."""
    db = request.app.state.db
    card = await models.update_flashcard(
        db, card_id, user["id"], body.english, body.example_kr, body.example_en
    )
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card


@router.delete("/{card_id}")
async def delete_card(
    card_id: int,
    request: Request,
    user: dict[str, Any] = Depends(get_current_user),
):
    """Delete a flashcard."""
    db = request.app.state.db
    deleted = await models.delete_flashcard(db, card_id, user["id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"deleted": True}
