from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, model_validator

from backend.auth import ensure_user
from backend.config import SUPPORTED_LANGUAGE_PAIRS
from backend.db import models
from backend.services.srs import SRSResult, calculate_srs, difficulty_to_quality, mode_result_to_quality

router = APIRouter()


class ReviewRequest(BaseModel):
    card_id: int
    difficulty: str = "medium"  # "easy", "medium", "hard" — used for flip mode
    study_mode: str = "flip"  # "flip", "type", "quiz"
    was_correct: bool | None = None  # required for type/quiz modes
    response_time_ms: int | None = None

    @model_validator(mode='after')
    def validate_mode_fields(self):
        if self.study_mode in ('type', 'quiz') and self.was_correct is None:
            raise ValueError('was_correct is required for type/quiz study modes')
        return self


@router.get("/due")
async def get_due_cards(
    request: Request,
    limit: int = 20,
    language_pair: str | None = None,
    deck_id: int | None = None,
    user: dict[str, Any] = Depends(ensure_user),
):
    """Get cards due for review, optionally scoped to a language pair and/or deck."""
    if language_pair is not None and language_pair not in SUPPORTED_LANGUAGE_PAIRS:
        raise HTTPException(status_code=400, detail=f"Unsupported language pair: {language_pair}")
    db = request.app.state.db
    user_id = user["id"]

    cards = await models.get_due_flashcards(db, user_id, limit, language_pair=language_pair, deck_id=deck_id)

    # Get total due count
    stats = await models.get_user_stats(db, user_id, language_pair=language_pair, deck_id=deck_id)

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

    # Derive quality based on study mode
    try:
        quality = mode_result_to_quality(body.study_mode, body.difficulty, body.was_correct)
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

    # Log review to history
    await models.log_review(
        db, user_id, body.card_id, body.study_mode,
        body.was_correct, quality, body.response_time_ms,
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


@router.get("/quiz-options")
async def get_quiz_options(
    request: Request,
    card_id: int,
    count: int = 3,
    side: str = "target",
    user: dict[str, Any] = Depends(ensure_user),
):
    """Get distractor options for multiple choice quiz mode."""
    # Validate side parameter
    if side not in ("source", "target"):
        raise HTTPException(status_code=400, detail="side must be 'source' or 'target'")

    db = request.app.state.db
    user_id = user["id"]

    # Verify card exists and belongs to user
    card = await models.get_flashcard_by_id(db, card_id, user_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    options = await models.get_random_distractors(
        db, user_id, card_id, card["language_pair"], side, count
    )

    return {"options": options}
