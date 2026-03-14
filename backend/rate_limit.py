"""Per-user sliding window rate limiter as a FastAPI dependency."""

from __future__ import annotations

import logging
import time

from fastapi import Depends, HTTPException, Request
from fastapi.responses import JSONResponse

from backend import config
from backend.auth import ensure_user

logger = logging.getLogger(__name__)

# Sliding window storage: (user_id, group) -> list of timestamps
_windows: dict[tuple[int, str], list[float]] = {}

WINDOW_SECONDS = 3600  # 1 hour

# Rate limits per endpoint group (requests per hour)
_LIMITS: dict[str, int] = {
    "translate": config.RATE_LIMIT_TRANSLATE,
    "explain": config.RATE_LIMIT_EXPLAIN,
    "translate_image": config.RATE_LIMIT_IMAGE,
    "tts": config.RATE_LIMIT_TTS,
}


def _prune(timestamps: list[float], now: float) -> list[float]:
    """Remove timestamps older than the window."""
    cutoff = now - WINDOW_SECONDS
    return [t for t in timestamps if t > cutoff]


def _check(user_id: int, group: str) -> int | None:
    """Check rate limit. Returns seconds until retry if limited, None if OK."""
    limit = _LIMITS.get(group)
    if limit is None:
        return None

    now = time.monotonic()
    key = (user_id, group)

    timestamps = _prune(_windows.get(key, []), now)
    _windows[key] = timestamps

    if len(timestamps) >= limit:
        oldest = timestamps[0]
        retry_after = int(oldest + WINDOW_SECONDS - now) + 1
        return max(retry_after, 1)

    timestamps.append(now)
    return None


def rate_limit(group: str):
    """Factory that returns a FastAPI dependency for the given rate limit group."""

    async def dependency(
        request: Request,
        user: dict = Depends(ensure_user),
    ):
        user_id = user["id"]

        # Admin is exempt from rate limits
        if user_id == config.ADMIN_USER_ID:
            return user

        retry_after = _check(user_id, group)
        if retry_after is not None:
            logger.warning(
                "Rate limit hit: user=%s group=%s retry_after=%ds",
                user_id, group, retry_after,
            )
            raise HTTPException(
                status_code=429,
                detail=f"Too many requests. Try again in {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)},
            )
        return user

    return dependency
