from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status

from backend import config
from backend.auth import ensure_user
from backend.db import models

router = APIRouter()


async def require_admin(
    user: dict[str, Any] = Depends(ensure_user),
) -> dict[str, Any]:
    """Dependency that requires the current user to be the admin."""
    if config.ADMIN_USER_ID == 0 or user["id"] != config.ADMIN_USER_ID:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


@router.get("/check")
async def check_admin(
    user: dict[str, Any] = Depends(ensure_user),
):
    """Check if the current user is admin."""
    is_admin = config.ADMIN_USER_ID != 0 and user["id"] == config.ADMIN_USER_ID
    return {"is_admin": is_admin}


@router.get("/stats")
async def get_admin_stats(
    request: Request,
    user: dict[str, Any] = Depends(require_admin),
):
    """Get global admin statistics."""
    db = request.app.state.db
    stats = await models.get_admin_global_stats(db)
    return stats


@router.get("/users")
async def get_admin_users(
    request: Request,
    user: dict[str, Any] = Depends(require_admin),
):
    """Get per-user statistics."""
    db = request.app.state.db
    users = await models.get_admin_user_stats(db)
    return {"users": users}
