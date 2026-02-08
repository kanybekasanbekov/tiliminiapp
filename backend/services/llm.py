from __future__ import annotations

import asyncio
import json
import logging
import re
from abc import ABC, abstractmethod

import anthropic
import openai
from pydantic import BaseModel

from backend import config

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
RETRY_DELAY_BASE = 1.0

SYSTEM_PROMPT = """You are a Korean language expert. Given a Korean word, phrase, or sentence, provide:
1. The Korean word, phrase, or sentence (cleaned/corrected if needed)
2. English translation. If the word has multiple meanings, provide the English translation for each meaning.
3. An example sentence in Korean using this word, and its English translation.
   Use polite/존댓말 form (e.g. ~요/~습니다 endings) for example sentences.

Respond with ONLY a raw JSON object, no markdown, no code fences, no explanation:
{"korean": "...", "english": "...", "example_kr": "...", "example_en": "..."}

If the word is not a valid Korean word, respond with "Invalid word"."""


def _extract_json(text: str) -> dict:
    """Extract JSON from LLM response, handling markdown code blocks."""
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass

    match = re.search(r"\{[^{}]*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not extract JSON from LLM response: {text[:200]}")


class TranslationResult(BaseModel):
    """Structured output from LLM translation."""

    korean: str
    english: str
    example_kr: str
    example_en: str


class LLMProvider(ABC):
    """Abstract base for LLM providers."""

    @abstractmethod
    async def translate_korean(self, word: str) -> TranslationResult:
        """Translate a Korean word and return structured data."""
        ...


class AnthropicProvider(LLMProvider):
    """Uses Anthropic Claude API for translation."""

    def __init__(self) -> None:
        self.client = anthropic.AsyncAnthropic(api_key=config.ANTHROPIC_API_KEY)
        self.model = config.LLM_MODEL

    async def translate_korean(self, word: str) -> TranslationResult:
        for attempt in range(MAX_RETRIES):
            try:
                response = await self.client.messages.create(
                    model=self.model,
                    max_tokens=512,
                    system=SYSTEM_PROMPT,
                    messages=[{"role": "user", "content": word}],
                )
                text = ""
                for block in response.content:
                    if hasattr(block, "text"):
                        text = block.text
                        break
                logger.debug("Anthropic raw response: %s", text)
                data = _extract_json(text)
                return TranslationResult.model_validate(data)
            except (
                anthropic.APIError,
                anthropic.APIConnectionError,
                anthropic.RateLimitError,
            ) as e:
                if attempt == MAX_RETRIES - 1:
                    raise
                delay = RETRY_DELAY_BASE * (2**attempt)
                logger.warning(
                    "Anthropic API attempt %d failed: %s. Retrying in %.1fs",
                    attempt + 1,
                    e,
                    delay,
                )
                await asyncio.sleep(delay)
        raise RuntimeError("Unreachable")


class OpenAIProvider(LLMProvider):
    """Uses OpenAI API for translation."""

    def __init__(self) -> None:
        self.client = openai.AsyncOpenAI(api_key=config.OPENAI_API_KEY)
        self.model = config.LLM_MODEL or "gpt-4o-mini"

    async def translate_korean(self, word: str) -> TranslationResult:
        for attempt in range(MAX_RETRIES):
            try:
                response = await self.client.chat.completions.create(
                    model=self.model,
                    max_tokens=512,
                    response_format={"type": "json_object"},
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": word},
                    ],
                )
                text = response.choices[0].message.content or "{}"
                logger.debug("OpenAI raw response: %s", text)
                data = _extract_json(text)
                return TranslationResult.model_validate(data)
            except (
                openai.APIError,
                openai.APIConnectionError,
                openai.RateLimitError,
            ) as e:
                if attempt == MAX_RETRIES - 1:
                    raise
                delay = RETRY_DELAY_BASE * (2**attempt)
                logger.warning(
                    "OpenAI API attempt %d failed: %s. Retrying in %.1fs",
                    attempt + 1,
                    e,
                    delay,
                )
                await asyncio.sleep(delay)
        raise RuntimeError("Unreachable")


def create_llm_provider() -> LLMProvider:
    """Factory: reads LLM_PROVIDER from config, returns the appropriate provider."""
    provider = config.LLM_PROVIDER.lower()
    if provider == "anthropic":
        return AnthropicProvider()
    elif provider == "openai":
        return OpenAIProvider()
    else:
        raise ValueError(f"Unknown LLM provider: {provider!r}. Use 'anthropic' or 'openai'.")
