from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Request

from backend.auth import get_current_user
from backend.db import models

router = APIRouter()


@router.get("")
async def get_stats(
    request: Request,
    user: dict[str, Any] = Depends(get_current_user),
):
    """Get user learning statistics."""
    db = request.app.state.db
    stats = await models.get_user_stats(db, user["id"])
    return stats
