from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request

from backend.auth import ensure_user
from backend.config import SUPPORTED_LANGUAGE_PAIRS
from backend.db import models

router = APIRouter()


@router.get("")
async def get_stats(
    request: Request,
    language_pair: str | None = None,
    user: dict[str, Any] = Depends(ensure_user),
):
    """Get user learning statistics, optionally scoped to a language pair."""
    if language_pair is not None and language_pair not in SUPPORTED_LANGUAGE_PAIRS:
        raise HTTPException(status_code=400, detail=f"Unsupported language pair: {language_pair}")
    db = request.app.state.db
    stats = await models.get_user_stats(db, user["id"], language_pair=language_pair)
    return stats
