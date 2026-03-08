from __future__ import annotations

from typing import Any, Literal

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from backend.auth import ensure_user
from backend.db import models

router = APIRouter()


class PreferencesUpdateRequest(BaseModel):
    preferred_deck_id: int | None = None
    active_language_pair: Literal["ko-en", "en-ko", "ko-ru", "en-ru"] | None = None


@router.get("/preferences")
async def get_preferences(
    user: dict[str, Any] = Depends(ensure_user),
):
    """Return the current user's preferences."""
    return user


@router.put("/preferences")
async def update_preferences(
    body: PreferencesUpdateRequest,
    request: Request,
    user: dict[str, Any] = Depends(ensure_user),
):
    """Update user preferences (e.g. preferred_deck_id, active_language_pair)."""
    db = request.app.state.db
    kwargs: dict[str, Any] = {}
    if body.preferred_deck_id is not None:
        kwargs["preferred_deck_id"] = body.preferred_deck_id
    if body.active_language_pair is not None:
        kwargs["active_language_pair"] = body.active_language_pair
    updated = await models.update_user_preferences(db, user["id"], **kwargs)
    return updated
