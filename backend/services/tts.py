from __future__ import annotations

import asyncio
import hashlib
import logging

import openai

from backend import config

logger = logging.getLogger(__name__)

MAX_TTS_RETRIES = 2
RETRY_DELAY_BASE = 0.5
TTS_TIMEOUT = 10  # seconds
MAX_TTS_TEXT_LENGTH = 200
TTS_COST_PER_CHAR = 0.60 / 1_000_000  # $0.60 per 1M chars for gpt-4o-mini-tts

# Language-specific pronunciation instructions for gpt-4o-mini-tts
_LANG_INSTRUCTIONS: dict[str, str] = {
    "ko": "Speak in Korean. Pronounce clearly and naturally with standard Seoul Korean accent. Use natural pacing suitable for a language learner.",
    "en": "Speak in English. Pronounce clearly and naturally with standard American English accent. Use natural pacing suitable for a language learner.",
    "ru": "Speak in Russian. Pronounce clearly and naturally with standard Russian accent. Use natural pacing suitable for a language learner.",
}
_DEFAULT_INSTRUCTION = "Pronounce clearly and naturally. Use natural pacing suitable for a language learner."


def compute_tts_hash(text: str, language: str, model: str, voice: str) -> str:
    """Compute SHA-256 hash for TTS cache key."""
    normalized = text.strip()
    return hashlib.sha256(f"{normalized}|{language}|{model}|{voice}".encode()).hexdigest()


class TTSService:
    """Text-to-Speech service using OpenAI TTS API with SQLite BLOB caching."""

    def __init__(self) -> None:
        self.client = openai.AsyncOpenAI(api_key=config.OPENAI_API_KEY)
        self.model = config.TTS_MODEL
        self.voice = config.TTS_VOICE
        self._locks: dict[str, asyncio.Lock] = {}

    async def get_audio(self, db, text: str, language: str) -> tuple[bytes, bool]:
        """Get TTS audio for text. Returns (mp3_bytes, was_cached).

        Checks cache first, generates on miss. Uses per-hash locking
        to prevent duplicate generation for concurrent requests.
        """
        text = text.strip()
        if not text:
            raise ValueError("Text cannot be empty")
        if len(text) > MAX_TTS_TEXT_LENGTH:
            raise ValueError(f"Text too long (max {MAX_TTS_TEXT_LENGTH} chars)")

        text_hash = compute_tts_hash(text, language, self.model, self.voice)

        # Check cache first (no lock needed for reads)
        cached = await self._get_cached(db, text_hash)
        if cached:
            return cached, True

        # Acquire per-hash lock to prevent duplicate generation
        if text_hash not in self._locks:
            self._locks[text_hash] = asyncio.Lock()

        async with self._locks[text_hash]:
            # Double-check cache after acquiring lock
            cached = await self._get_cached(db, text_hash)
            if cached:
                return cached, True

            # Generate audio
            audio_bytes = await self._generate(text, language)

            # Store in cache
            await self._store_cached(db, text_hash, text, language, audio_bytes)

            return audio_bytes, False

    async def _get_cached(self, db, text_hash: str) -> bytes | None:
        """Retrieve cached audio from database."""
        cursor = await db.execute(
            "SELECT audio_data FROM tts_cache WHERE text_hash = ?",
            (text_hash,),
        )
        row = await cursor.fetchone()
        if row:
            return row["audio_data"]
        return None

    async def _store_cached(
        self, db, text_hash: str, text: str, language: str, audio_data: bytes
    ) -> None:
        """Store generated audio in database cache."""
        await db.execute(
            """
            INSERT OR REPLACE INTO tts_cache (text_hash, text, language, audio_data, content_type, size_bytes)
            VALUES (?, ?, ?, ?, 'audio/mpeg', ?)
            """,
            (text_hash, text, language, audio_data, len(audio_data)),
        )
        await db.commit()

    async def _generate(self, text: str, language: str) -> bytes:
        """Generate TTS audio via OpenAI API with retry logic."""
        # Single words get better prosody with a trailing period
        tts_input = text if " " in text or text.endswith(".") else text + "."
        instructions = _LANG_INSTRUCTIONS.get(language, _DEFAULT_INSTRUCTION)
        for attempt in range(MAX_TTS_RETRIES):
            try:
                response = await asyncio.wait_for(
                    self.client.audio.speech.create(
                        model=self.model,
                        voice=self.voice,
                        input=tts_input,
                        response_format="mp3",
                        instructions=instructions,
                    ),
                    timeout=TTS_TIMEOUT,
                )
                audio_bytes = response.content
                if not audio_bytes:
                    raise ValueError("Empty audio response from OpenAI TTS")
                return audio_bytes
            except asyncio.TimeoutError:
                logger.warning("TTS generation timed out (attempt %d)", attempt + 1)
                if attempt == MAX_TTS_RETRIES - 1:
                    raise
            except (openai.APIError, openai.APIConnectionError, openai.RateLimitError) as e:
                if attempt == MAX_TTS_RETRIES - 1:
                    raise
                delay = RETRY_DELAY_BASE * (2 ** attempt)
                logger.warning(
                    "TTS API attempt %d failed: %s. Retrying in %.1fs",
                    attempt + 1, e, delay,
                )
                await asyncio.sleep(delay)
        raise RuntimeError("Unreachable")

    def estimate_cost(self, text: str) -> float:
        """Estimate USD cost for TTS generation."""
        return len(text.strip()) * TTS_COST_PER_CHAR
