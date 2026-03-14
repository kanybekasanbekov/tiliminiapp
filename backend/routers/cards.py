from __future__ import annotations

import base64
import logging
from typing import Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from pydantic import BaseModel

from backend.auth import ensure_user
from backend.config import SUPPORTED_LANGUAGE_PAIRS
from backend.db import models

logger = logging.getLogger(__name__)

router = APIRouter()

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB


class TranslateRequest(BaseModel):
    word: str
    language_pair: str = "ko-en"


class ExplainRequest(BaseModel):
    source_text: str
    target_text: str
    language_pair: str = "ko-en"


class CardCreateRequest(BaseModel):
    source_text: str
    target_text: str
    example_source: str | None = None
    example_target: str | None = None
    language_pair: str = "ko-en"
    deck_id: int | None = None
    part_of_speech: str | None = None


class CardUpdateRequest(BaseModel):
    target_text: str | None = None
    example_source: str | None = None
    example_target: str | None = None


class BatchCreateRequest(BaseModel):
    cards: list[CardCreateRequest]
    deck_id: int | None = None


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
        result, usage = await llm.translate(body.word, source_lang, target_lang)
        db = request.app.state.db
        try:
            await models.log_api_usage(
                db, user["id"], "translate", usage["model"],
                usage["input_tokens"], usage["output_tokens"],
                usage["estimated_cost_usd"], body.language_pair,
            )
        except Exception:
            logger.exception("Failed to log API usage for translate")
        return result.model_dump()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        logger.exception("Translation failed")
        raise HTTPException(status_code=500, detail="Translation failed")


@router.post("/translate-image")
async def translate_image(
    request: Request,
    image: UploadFile = File(...),
    language_pair: str = Form("ko-en"),
    user: dict[str, Any] = Depends(ensure_user),
):
    """Extract and translate all words from an uploaded image."""
    # Validate file type
    content_type = image.content_type or ""
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {content_type}. Use JPEG, PNG, or WebP.")

    # Read and validate size
    image_bytes = await image.read()
    if len(image_bytes) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Image too large. Maximum size is 5MB.")

    if language_pair not in SUPPORTED_LANGUAGE_PAIRS:
        raise HTTPException(status_code=400, detail=f"Unsupported language pair: {language_pair}")

    image_base64 = base64.b64encode(image_bytes).decode("utf-8")

    llm = request.app.state.llm
    try:
        source_lang, target_lang = language_pair.split("-", 1)
        results, usage = await llm.translate_image(image_base64, content_type, source_lang, target_lang)
        db = request.app.state.db
        try:
            await models.log_api_usage(
                db, user["id"], "translate_image", usage["model"],
                usage["input_tokens"], usage["output_tokens"],
                usage["estimated_cost_usd"], language_pair,
            )
        except Exception:
            logger.exception("Failed to log API usage for translate_image")
        # Check for duplicates
        source_texts = [r.source_text for r in results]
        duplicates = await models.check_duplicates_batch(db, user["id"], source_texts, language_pair)
        translations = []
        for r in results:
            item = r.model_dump()
            item["is_duplicate"] = r.source_text in duplicates
            translations.append(item)
        return {"translations": translations, "count": len(translations)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        logger.exception("Image translation failed")
        raise HTTPException(status_code=500, detail="Image translation failed")


@router.post("/batch")
async def create_cards_batch(
    body: BatchCreateRequest,
    request: Request,
    user: dict[str, Any] = Depends(ensure_user),
):
    """Create multiple flashcards in one request."""
    db = request.app.state.db
    user_id = user["id"]

    if not body.cards:
        raise HTTPException(status_code=400, detail="No cards provided")
    if len(body.cards) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 cards per batch")

    # Validate all cards share the same language pair
    language_pair = body.cards[0].language_pair
    if language_pair not in SUPPORTED_LANGUAGE_PAIRS:
        raise HTTPException(status_code=400, detail=f"Unsupported language pair: {language_pair}")
    if any(c.language_pair != language_pair for c in body.cards):
        raise HTTPException(status_code=400, detail="All cards in a batch must have the same language pair")

    # Check all duplicates at once
    source_texts = [c.source_text for c in body.cards]
    existing = await models.check_duplicates_batch(db, user_id, source_texts, language_pair)

    created_cards = []
    duplicates_count = 0
    for card in body.cards:
        if card.source_text in existing:
            duplicates_count += 1
            continue
        deck_id = body.deck_id or card.deck_id
        card_id = await models.add_flashcard(
            db, user_id, card.source_text, card.target_text,
            card.example_source, card.example_target, card.language_pair,
            deck_id=deck_id,
            part_of_speech=card.part_of_speech,
        )
        saved = await models.get_flashcard_by_id(db, card_id, user_id)
        if saved:
            created_cards.append(saved)
        # Add to existing set to catch duplicates within the batch itself
        existing.add(card.source_text)

    return {"created": len(created_cards), "duplicates": duplicates_count, "cards": created_cards}


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
        part_of_speech=body.part_of_speech,
    )
    card = await models.get_flashcard_by_id(db, card_id, user_id)
    return card


@router.get("")
async def list_cards(
    request: Request,
    page: int = 1,
    per_page: int = 10,
    deck_id: int | None = None,
    language_pair: str | None = None,
    user: dict[str, Any] = Depends(ensure_user),
):
    """List user's flashcards with pagination, optionally filtered by deck and/or language pair."""
    if per_page < 1:
        raise HTTPException(status_code=400, detail="per_page must be >= 1")
    if language_pair is not None and language_pair not in SUPPORTED_LANGUAGE_PAIRS:
        raise HTTPException(status_code=400, detail=f"Unsupported language pair: {language_pair}")
    db = request.app.state.db
    user_id = user["id"]
    offset = (page - 1) * per_page

    cards, total = await models.get_all_flashcards(db, user_id, offset, per_page, deck_id=deck_id, language_pair=language_pair)
    total_pages = (total + per_page - 1) // per_page

    return {
        "cards": cards,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
    }


@router.get("/search")
async def search_cards(
    request: Request,
    q: str,
    page: int = 1,
    per_page: int = 10,
    language_pair: str = "ko-en",
    user: dict[str, Any] = Depends(ensure_user),
):
    """Search cards by source or target text within a language pair."""
    if per_page < 1:
        raise HTTPException(status_code=400, detail="per_page must be >= 1")
    if not q.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty")
    if language_pair not in SUPPORTED_LANGUAGE_PAIRS:
        raise HTTPException(status_code=400, detail=f"Unsupported language pair: {language_pair}")
    db = request.app.state.db
    user_id = user["id"]
    offset = (page - 1) * per_page

    cards, total = await models.search_flashcards(db, user_id, q.strip(), language_pair, offset, per_page)
    total_pages = (total + per_page - 1) // per_page

    return {
        "cards": cards,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
    }


@router.post("/explain")
async def explain_word(
    body: ExplainRequest,
    request: Request,
    user: dict[str, Any] = Depends(ensure_user),
):
    """Generate explanation for a word without requiring a saved card."""
    llm = request.app.state.llm
    try:
        source_lang, target_lang = body.language_pair.split("-", 1)
        explanation_text, usage = await llm.explain_word(
            body.source_text, body.target_text, source_lang, target_lang
        )
        db = request.app.state.db
        try:
            await models.log_api_usage(
                db, user["id"], "explain", usage["model"],
                usage["input_tokens"], usage["output_tokens"],
                usage["estimated_cost_usd"], body.language_pair,
            )
        except Exception:
            logger.exception("Failed to log API usage for explain")
    except Exception:
        logger.exception("Explanation failed")
        raise HTTPException(status_code=500, detail="Explanation failed")
    return {"explanation": explanation_text}


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
        explanation_text, usage = await llm.explain_word(
            card["source_text"], card["target_text"], source_lang, target_lang
        )
        try:
            await models.log_api_usage(
                db, user_id, "explain", usage["model"],
                usage["input_tokens"], usage["output_tokens"],
                usage["estimated_cost_usd"], card["language_pair"],
            )
        except Exception:
            logger.exception("Failed to log API usage for explain")
    except Exception:
        logger.exception("Explanation generation failed")
        raise HTTPException(status_code=500, detail="Explanation failed")

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
