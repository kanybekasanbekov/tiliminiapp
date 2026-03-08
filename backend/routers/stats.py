from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Request

from backend.auth import ensure_user
from backend.db import models

router = APIRouter()


@router.get("")
async def get_stats(
    request: Request,
    user: dict[str, Any] = Depends(ensure_user),
):
    """Get user learning statistics."""
    db = request.app.state.db
    stats = await models.get_user_stats(db, user["id"])
    return stats
