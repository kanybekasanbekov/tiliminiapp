from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from backend.auth import ensure_user
from backend.db import models

router = APIRouter()


class TranslateRequest(BaseModel):
    word: str
    language_pair: str = "ko-en"


class CardCreateRequest(BaseModel):
    source_text: str
    target_text: str
    example_source: str | None = None
    example_target: str | None = None
    language_pair: str = "ko-en"
    deck_id: int | None = None


class CardUpdateRequest(BaseModel):
    target_text: str | None = None
    example_source: str | None = None
    example_target: str | None = None


@router.post("/translate")
async def translate_word(
    body: TranslateRequest,
    request: Request,
    user: dict[str, Any] = Depends(ensure_user),
):
    """Translate a word using AI."""
    llm = request.app.state.llm
    try:
        source_lang, target_lang = body.language_pair.split("-", 1)
        result = await llm.translate(body.word, source_lang, target_lang)
        return result.model_dump()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")


@router.post("")
async def create_card(
    body: CardCreateRequest,
    request: Request,
    user: dict[str, Any] = Depends(ensure_user),
):
    """Save a new flashcard."""
    db = request.app.state.db
    user_id = user["id"]

    # Check for duplicate
    if await models.check_duplicate(db, user_id, body.source_text, body.language_pair):
        raise HTTPException(status_code=400, detail="You already have a card for this word")

    card_id = await models.add_flashcard(
        db, user_id, body.source_text, body.target_text, body.example_source, body.example_target, body.language_pair,
        deck_id=body.deck_id,
    )
    card = await models.get_flashcard_by_id(db, card_id, user_id)
    return card


@router.get("")
async def list_cards(
    request: Request,
    page: int = 1,
    per_page: int = 10,
    deck_id: int | None = None,
    user: dict[str, Any] = Depends(ensure_user),
):
    """List user's flashcards with pagination, optionally filtered by deck."""
    db = request.app.state.db
    user_id = user["id"]
    offset = (page - 1) * per_page

    cards, total = await models.get_all_flashcards(db, user_id, offset, per_page, deck_id=deck_id)
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
    user: dict[str, Any] = Depends(ensure_user),
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
    user: dict[str, Any] = Depends(ensure_user),
):
    """Update a flashcard's editable fields."""
    db = request.app.state.db
    card = await models.update_flashcard(
        db, card_id, user["id"], body.target_text, body.example_source, body.example_target
    )
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card


@router.get("/{card_id}/explanation")
async def get_explanation(
    card_id: int,
    request: Request,
    user: dict[str, Any] = Depends(ensure_user),
):
    """Get cached explanation for a card."""
    db = request.app.state.db
    explanation = await models.get_explanation(db, card_id, user["id"])
    if not explanation:
        raise HTTPException(status_code=404, detail="No explanation found")
    return {"explanation": explanation["explanation"], "card_id": card_id}


@router.post("/{card_id}/explanation")
async def generate_explanation(
    card_id: int,
    request: Request,
    user: dict[str, Any] = Depends(ensure_user),
):
    """Generate explanation via LLM, cache it, return it."""
    db = request.app.state.db
    user_id = user["id"]

    # Return cached if exists
    cached = await models.get_explanation(db, card_id, user_id)
    if cached:
        return {"explanation": cached["explanation"], "card_id": card_id}

    # Fetch card and verify ownership
    card = await models.get_flashcard_by_id(db, card_id, user_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    # Generate via LLM
    llm = request.app.state.llm
    try:
        source_lang, target_lang = card["language_pair"].split("-", 1)
        explanation_text = await llm.explain_word(
            card["source_text"], card["target_text"], source_lang, target_lang
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explanation failed: {str(e)}")

    # Cache in DB
    await models.save_explanation(db, card_id, user_id, explanation_text)
    return {"explanation": explanation_text, "card_id": card_id}


@router.delete("/{card_id}")
async def delete_card(
    card_id: int,
    request: Request,
    user: dict[str, Any] = Depends(ensure_user),
):
    """Delete a flashcard."""
    db = request.app.state.db
    deleted = await models.delete_flashcard(db, card_id, user["id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"deleted": True}
