from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from backend.auth import ensure_user
from backend.config import SUPPORTED_LANGUAGE_PAIRS
from backend.db import models
from backend.services.srs import SRSResult, calculate_srs, difficulty_to_quality

router = APIRouter()


class ReviewRequest(BaseModel):
    card_id: int
    difficulty: str  # "easy", "medium", "hard"


@router.get("/due")
async def get_due_cards(
    request: Request,
    limit: int = 20,
    language_pair: str | None = None,
    user: dict[str, Any] = Depends(ensure_user),
):
    """Get cards due for review, optionally scoped to a language pair."""
    if language_pair is not None and language_pair not in SUPPORTED_LANGUAGE_PAIRS:
        raise HTTPException(status_code=400, detail=f"Unsupported language pair: {language_pair}")
    db = request.app.state.db
    user_id = user["id"]

    cards = await models.get_due_flashcards(db, user_id, limit, language_pair=language_pair)

    # Get total due count
    stats = await models.get_user_stats(db, user_id, language_pair=language_pair)

    return {
        "cards": cards,
        "total_due": stats["due"],
    }


@router.post("/review")
async def submit_review(
    body: ReviewRequest,
    request: Request,
    user: dict[str, Any] = Depends(ensure_user),
):
    """Submit a review rating for a card."""
    db = request.app.state.db
    user_id = user["id"]

    # Validate difficulty
    try:
        quality = difficulty_to_quality(body.difficulty)
    except KeyError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid difficulty: {body.difficulty}. Use 'easy', 'medium', or 'hard'.",
        )

    # Get current card
    card = await models.get_flashcard_by_id(db, body.card_id, user_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    # Calculate new SRS values
    result: SRSResult = calculate_srs(
        quality=quality,
        current_ease=card["ease_factor"],
        current_interval=card["interval_days"],
        current_reps=card["repetitions"],
    )

    # Update card
    await models.update_flashcard_srs(
        db,
        body.card_id,
        result.ease_factor,
        result.interval_days,
        result.repetitions,
        result.next_review.strftime("%Y-%m-%d %H:%M:%S"),
    )

    # Update daily practice streak
    await models.update_streak(db, user_id)

    # Get remaining due count scoped to the card's language pair
    stats = await models.get_user_stats(db, user_id, language_pair=card.get("language_pair"))

    return {
        "next_review": result.next_review.strftime("%Y-%m-%d %H:%M:%S"),
        "interval_days": result.interval_days,
        "remaining_due": stats["due"],
    }
