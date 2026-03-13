from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response

from backend.auth import ensure_user
from backend.db import models

logger = logging.getLogger(__name__)

router = APIRouter()

ALLOWED_TTS_LANGUAGES = {"ko", "en", "ru"}


@router.get("")
async def get_tts_audio(
    request: Request,
    text: str,
    lang: str = "ko",
    user: dict[str, Any] = Depends(ensure_user),
):
    """Generate or retrieve cached TTS audio for text.

    Returns MP3 audio bytes with appropriate headers.
    Audio is cached globally (same text+lang = same audio for all users).
    """
    # Validate language
    if lang not in ALLOWED_TTS_LANGUAGES:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {lang}")

    # Validate text
    text = text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    if len(text) > 200:
        raise HTTPException(status_code=400, detail="Text too long (max 200 chars)")

    db = request.app.state.db
    tts = request.app.state.tts

    try:
        audio_bytes, was_cached = await tts.get_audio(db, text, lang)

        # Log API usage only on cache miss (actual TTS API call)
        if not was_cached:
            cost = tts.estimate_cost(text)
            await models.log_api_usage(
                db, user["id"], "tts", tts.model,
                len(text), 0, cost, None,
            )

        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Cache-Control": "no-store",
                "Content-Length": str(len(audio_bytes)),
            },
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("TTS generation failed: %s", e)
        raise HTTPException(status_code=503, detail="TTS generation temporarily unavailable")
