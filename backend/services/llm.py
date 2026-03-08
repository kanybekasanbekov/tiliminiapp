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

SUPPORTED_PAIRS: dict[str, dict] = {
    "ko-en": {
        "source_name": "Korean",
        "target_name": "English",
        "extra_instructions": "Use polite/존댓말 form (e.g. ~요/~습니다 endings) for example sentences.",
    },
    "en-ko": {
        "source_name": "English",
        "target_name": "Korean",
        "extra_instructions": "Use polite/존댓말 form (e.g. ~요/~습니다 endings) for example sentences.",
    },
    "ko-ru": {
        "source_name": "Korean",
        "target_name": "Russian",
        "extra_instructions": "Use polite/존댓말 form (e.g. ~요/~습니다 endings) for example sentences in Korean. Use formal register for Russian translations.",
    },
    "en-ru": {
        "source_name": "English",
        "target_name": "Russian",
        "extra_instructions": "Use formal register for Russian translations.",
    },
}


def build_translation_prompt(source_lang: str, target_lang: str) -> str:
    """Build a translation system prompt for the given language pair."""
    pair_key = f"{source_lang}-{target_lang}"
    pair = SUPPORTED_PAIRS.get(pair_key)
    if pair:
        source_name = pair["source_name"]
        target_name = pair["target_name"]
        extra = pair["extra_instructions"]
    else:
        source_name = source_lang.upper()
        target_name = target_lang.upper()
        extra = ""

    extra_line = f"\n   {extra}" if extra else ""

    return f"""You are a {source_name} language expert. Given a {source_name} word, phrase, or sentence, provide:
1. The {source_name} word, phrase, or sentence (cleaned/corrected if needed)
2. {target_name} translation. If the word has multiple meanings, provide the {target_name} translation for each meaning.
3. An example sentence in {source_name} using this word, and its {target_name} translation.{extra_line}

Respond with ONLY a raw JSON object, no markdown, no code fences, no explanation:
{{"source_text": "...", "target_text": "...", "example_source": "...", "example_target": "..."}}

If the word is not a valid {source_name} word, respond with "Invalid word"."""


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

    source_text: str
    target_text: str
    example_source: str
    example_target: str


class LLMProvider(ABC):
    """Abstract base for LLM providers."""

    @abstractmethod
    async def translate(self, word: str, source_lang: str = "ko", target_lang: str = "en") -> TranslationResult:
        """Translate a word and return structured data."""
        ...


class AnthropicProvider(LLMProvider):
    """Uses Anthropic Claude API for translation."""

    def __init__(self) -> None:
        self.client = anthropic.AsyncAnthropic(api_key=config.ANTHROPIC_API_KEY)
        self.model = config.LLM_MODEL

    async def translate(self, word: str, source_lang: str = "ko", target_lang: str = "en") -> TranslationResult:
        system_prompt = build_translation_prompt(source_lang, target_lang)
        for attempt in range(MAX_RETRIES):
            try:
                response = await self.client.messages.create(
                    model=self.model,
                    max_tokens=512,
                    system=system_prompt,
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
        self.model = config.LLM_MODEL or "gpt-4.1-mini"

    async def translate(self, word: str, source_lang: str = "ko", target_lang: str = "en") -> TranslationResult:
        system_prompt = build_translation_prompt(source_lang, target_lang)
        for attempt in range(MAX_RETRIES):
            try:
                response = await self.client.chat.completions.create(
                    model=self.model,
                    max_tokens=512,
                    response_format={"type": "json_object"},
                    messages=[
                        {"role": "system", "content": system_prompt},
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
