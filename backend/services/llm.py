from __future__ import annotations

import asyncio
import json
import logging
import re
from abc import ABC, abstractmethod
from collections import OrderedDict

import anthropic
import openai
from pydantic import BaseModel, field_validator

from backend import config

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
RETRY_DELAY_BASE = 1.0


class LRUCache:
    """Simple in-memory LRU cache using OrderedDict."""

    def __init__(self, max_size: int) -> None:
        self._cache: OrderedDict[str, object] = OrderedDict()
        self._max_size = max_size
        self.hits = 0
        self.misses = 0

    def get(self, key: str) -> object | None:
        if key in self._cache:
            self._cache.move_to_end(key)
            self.hits += 1
            return self._cache[key]
        self.misses += 1
        return None

    def put(self, key: str, value: object) -> None:
        if key in self._cache:
            self._cache.move_to_end(key)
            self._cache[key] = value
            return
        if len(self._cache) >= self._max_size:
            self._cache.popitem(last=False)
        self._cache[key] = value

    @property
    def size(self) -> int:
        return len(self._cache)


# Module-level caches (initialized once at import time)
_translation_cache = LRUCache(config.TRANSLATION_CACHE_SIZE)
_explanation_cache = LRUCache(config.EXPLANATION_CACHE_SIZE)

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

MODEL_PRICING: dict[str, tuple[float, float]] = {
    # (input_price_per_1M_tokens, output_price_per_1M_tokens)
    "gpt-4.1-mini": (0.40, 1.60),
    "gpt-4.1-nano": (0.10, 0.40),
    "gpt-4.1": (2.00, 8.00),
    "gpt-4o-mini": (0.15, 0.60),
    "gpt-4o": (2.50, 10.00),
    "claude-sonnet-4-20250514": (3.00, 15.00),
    "claude-haiku-4-5-20251001": (0.80, 4.00),
}


def estimate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    """Estimate USD cost from token counts using MODEL_PRICING."""
    pricing = MODEL_PRICING.get(model)
    if not pricing:
        return 0.0
    input_price, output_price = pricing
    return (input_tokens * input_price + output_tokens * output_price) / 1_000_000


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

    return f"""You are a {source_name}-{target_name} language expert. The user may input a word, phrase, or sentence in either {source_name} or {target_name}. Detect the input language and provide:
1. `source_text`: The word/phrase in {source_name} (cleaned/corrected if needed)
2. `target_text`: The translation in {target_name}. If the word has multiple meanings, provide the translation for each meaning.
3. `example_source`: An example sentence in {source_name} using this word.
4. `example_target`: The {target_name} translation of the example sentence.
5. `part_of_speech`: The grammatical category of the source word (e.g. noun, verb, adjective, adverb, preposition, conjunction, pronoun, particle, etc.)

If the input is in {target_name}, translate it to {source_name} for `source_text` and use the original input as `target_text`.
If the input is in {source_name}, use it as `source_text` and translate to {target_name} for `target_text`.{extra_line}

Respond with ONLY a raw JSON object, no markdown, no code fences, no explanation:
{{"source_text": "...", "target_text": "...", "example_source": "...", "example_target": "...", "part_of_speech": "..."}}

If the word is not valid in either {source_name} or {target_name}, respond with "Invalid word"."""


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


def _extract_json_array(text: str) -> list[dict]:
    """Extract a JSON array from LLM response, handling markdown code blocks."""
    text = text.strip()

    try:
        result = json.loads(text)
        if isinstance(result, list):
            return result
    except json.JSONDecodeError:
        pass

    match = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", text, re.DOTALL)
    if match:
        try:
            result = json.loads(match.group(1).strip())
            if isinstance(result, list):
                return result
        except json.JSONDecodeError:
            pass

    match = re.search(r"\[.*\]", text, re.DOTALL)
    if match:
        try:
            result = json.loads(match.group(0))
            if isinstance(result, list):
                return result
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not extract JSON array from LLM response: {text[:200]}")


def build_image_translation_prompt(source_lang: str, target_lang: str) -> str:
    """Build a prompt for extracting and translating words from an image."""
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

    extra_line = f"\n{extra}" if extra else ""

    return f"""You are a {source_name}-{target_name} language expert. The user will provide an image containing a list of vocabulary words or phrases in {source_name}.

Your task:
1. Extract ALL words and phrases visible in the image.
2. For each word/phrase, provide a translation with an example sentence.

For each entry, provide:
- `source_text`: The word/phrase in {source_name} (cleaned/corrected if needed)
- `target_text`: The translation in {target_name}. If the word has multiple meanings, provide the most common meaning.
- `example_source`: An example sentence in {source_name} using this word.
- `example_target`: The {target_name} translation of the example sentence.
- `part_of_speech`: The grammatical category (e.g. noun, verb, adjective, adverb, etc.)
{extra_line}
Respond with ONLY a raw JSON array, no markdown, no code fences, no explanation:
[{{"source_text": "...", "target_text": "...", "example_source": "...", "example_target": "...", "part_of_speech": "..."}}, ...]

Extract every word/phrase you can see. Do not skip any."""


class TranslationResult(BaseModel):
    """Structured output from LLM translation."""

    source_text: str
    target_text: str
    example_source: str
    example_target: str
    part_of_speech: str | None = None

    @field_validator("part_of_speech", mode="before")
    @classmethod
    def normalize_pos(cls, v: str | None) -> str | None:
        if isinstance(v, str) and v.strip():
            return v.strip().lower()
        return None


def build_explanation_prompt(word: str, translation: str, source_lang: str, target_lang: str) -> str:
    """Build a prompt for generating a word explanation."""
    pair_key = f"{source_lang}-{target_lang}"
    pair = SUPPORTED_PAIRS.get(pair_key)
    source_name = pair["source_name"] if pair else source_lang.upper()
    target_name = pair["target_name"] if pair else target_lang.upper()

    return f"""You are a {source_name} language expert. Explain the following word to a {target_name}-speaking learner.

Word: {word}
Translation: {translation}

Provide a concise but informative explanation in {target_name} covering:
1. **Word structure** — etymology, roots, how the word is formed (prefixes, suffixes, particles)
2. **Usage patterns** — when and how this word is commonly used
3. **Example sentences** — 2-3 additional examples with {target_name} translations
4. **Related words** — similar or related vocabulary

Use markdown formatting (bold, bullet points). Keep it concise — no more than 200 words.
Return ONLY the explanation text, no preamble or quotes."""


async def _call_with_retry(fn, retryable_exceptions: tuple, label: str):
    """Call fn() with exponential backoff retry on transient errors."""
    for attempt in range(MAX_RETRIES):
        try:
            return await fn()
        except retryable_exceptions as e:
            if attempt == MAX_RETRIES - 1:
                raise
            delay = RETRY_DELAY_BASE * (2 ** attempt)
            logger.warning("%s attempt %d failed: %s. Retrying in %.1fs", label, attempt + 1, e, delay)
            await asyncio.sleep(delay)
    raise RuntimeError("Unreachable")


class LLMProvider(ABC):
    """Abstract base for LLM providers."""

    @abstractmethod
    async def translate(self, word: str, source_lang: str = "ko", target_lang: str = "en") -> tuple[TranslationResult, dict, bool]:
        """Translate a word. Returns (result, usage, was_cached)."""
        ...

    @abstractmethod
    async def explain_word(self, word: str, translation: str, source_lang: str, target_lang: str) -> tuple[str, dict, bool]:
        """Generate explanation. Returns (markdown, usage, was_cached)."""
        ...

    @abstractmethod
    async def translate_image(self, image_base64: str, media_type: str, source_lang: str = "ko", target_lang: str = "en") -> tuple[list[TranslationResult], dict]:
        """Extract and translate all words from an image. Returns (list of translations, usage info)."""
        ...


class AnthropicProvider(LLMProvider):
    """Uses Anthropic Claude API for translation."""

    _RETRYABLE = (anthropic.APIError, anthropic.APIConnectionError, anthropic.RateLimitError)

    def __init__(self) -> None:
        self.client = anthropic.AsyncAnthropic(api_key=config.ANTHROPIC_API_KEY)
        self.model = config.LLM_MODEL

    def _extract_text(self, response) -> str:
        for block in response.content:
            if hasattr(block, "text"):
                return block.text
        return ""

    def _usage(self, response) -> dict:
        usage = {
            "model": self.model,
            "input_tokens": getattr(response.usage, 'input_tokens', 0),
            "output_tokens": getattr(response.usage, 'output_tokens', 0),
        }
        usage["estimated_cost_usd"] = estimate_cost(usage["model"], usage["input_tokens"], usage["output_tokens"])
        return usage

    async def translate(self, word: str, source_lang: str = "ko", target_lang: str = "en") -> tuple[TranslationResult, dict, bool]:
        system_prompt = build_translation_prompt(source_lang, target_lang)

        async def call():
            response = await self.client.messages.create(
                model=self.model, max_tokens=512, system=system_prompt,
                messages=[{"role": "user", "content": word}],
            )
            text = self._extract_text(response)
            logger.debug("Anthropic raw response: %s", text)
            return TranslationResult.model_validate(_extract_json(text)), self._usage(response), False

        return await _call_with_retry(call, self._RETRYABLE, "Anthropic translate")

    async def explain_word(self, word: str, translation: str, source_lang: str, target_lang: str) -> tuple[str, dict, bool]:
        prompt = build_explanation_prompt(word, translation, source_lang, target_lang)

        async def call():
            response = await self.client.messages.create(
                model=self.model, max_tokens=1024,
                messages=[{"role": "user", "content": prompt}],
            )
            text = self._extract_text(response)
            logger.debug("Anthropic explain response: %s", text)
            return text.strip().strip("`").strip(), self._usage(response), False

        return await _call_with_retry(call, self._RETRYABLE, "Anthropic explain")

    async def translate_image(self, image_base64: str, media_type: str, source_lang: str = "ko", target_lang: str = "en") -> tuple[list[TranslationResult], dict]:
        system_prompt = build_image_translation_prompt(source_lang, target_lang)

        async def call():
            response = await self.client.messages.create(
                model=self.model, max_tokens=4096, system=system_prompt,
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": image_base64}},
                        {"type": "text", "text": "Extract and translate all words/phrases from this image."},
                    ],
                }],
            )
            text = self._extract_text(response)
            logger.debug("Anthropic image translate response: %s", text[:500])
            results = [TranslationResult.model_validate(item) for item in _extract_json_array(text)]
            return results, self._usage(response)

        return await _call_with_retry(call, self._RETRYABLE, "Anthropic image translate")


class OpenAIProvider(LLMProvider):
    """Uses OpenAI API for translation."""

    _RETRYABLE = (openai.APIError, openai.APIConnectionError, openai.RateLimitError)

    def __init__(self) -> None:
        self.client = openai.AsyncOpenAI(api_key=config.OPENAI_API_KEY)
        self.model = config.LLM_MODEL or "gpt-4.1-mini"

    def _usage(self, response) -> dict:
        usage_obj = response.usage
        usage = {
            "model": self.model,
            "input_tokens": getattr(usage_obj, 'prompt_tokens', 0) if usage_obj else 0,
            "output_tokens": getattr(usage_obj, 'completion_tokens', 0) if usage_obj else 0,
        }
        usage["estimated_cost_usd"] = estimate_cost(usage["model"], usage["input_tokens"], usage["output_tokens"])
        return usage

    async def translate(self, word: str, source_lang: str = "ko", target_lang: str = "en") -> tuple[TranslationResult, dict, bool]:
        system_prompt = build_translation_prompt(source_lang, target_lang)

        async def call():
            response = await self.client.chat.completions.create(
                model=self.model, max_tokens=512,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": word},
                ],
            )
            text = response.choices[0].message.content or "{}"
            logger.debug("OpenAI raw response: %s", text)
            return TranslationResult.model_validate(_extract_json(text)), self._usage(response), False

        return await _call_with_retry(call, self._RETRYABLE, "OpenAI translate")

    async def explain_word(self, word: str, translation: str, source_lang: str, target_lang: str) -> tuple[str, dict, bool]:
        prompt = build_explanation_prompt(word, translation, source_lang, target_lang)

        async def call():
            response = await self.client.chat.completions.create(
                model=self.model, max_tokens=1024,
                messages=[{"role": "user", "content": prompt}],
            )
            text = response.choices[0].message.content or ""
            logger.debug("OpenAI explain response: %s", text)
            return text.strip().strip("`").strip(), self._usage(response), False

        return await _call_with_retry(call, self._RETRYABLE, "OpenAI explain")

    async def translate_image(self, image_base64: str, media_type: str, source_lang: str = "ko", target_lang: str = "en") -> tuple[list[TranslationResult], dict]:
        system_prompt = build_image_translation_prompt(source_lang, target_lang)

        async def call():
            response = await self.client.chat.completions.create(
                model=self.model, max_tokens=4096,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt + '\n\nIMPORTANT: Wrap the array in a JSON object like: {"words": [...]}'},
                    {
                        "role": "user",
                        "content": [
                            {"type": "image_url", "image_url": {"url": f"data:{media_type};base64,{image_base64}"}},
                            {"type": "text", "text": "Extract and translate all words/phrases from this image."},
                        ],
                    },
                ],
            )
            text = response.choices[0].message.content or "[]"
            logger.debug("OpenAI image translate response: %s", text[:500])
            try:
                parsed = json.loads(text)
                if isinstance(parsed, dict) and "words" in parsed:
                    items = parsed["words"]
                elif isinstance(parsed, list):
                    items = parsed
                else:
                    items = next((v for v in parsed.values() if isinstance(v, list)), [])
            except json.JSONDecodeError:
                items = _extract_json_array(text)
            return [TranslationResult.model_validate(item) for item in items], self._usage(response)

        return await _call_with_retry(call, self._RETRYABLE, "OpenAI image translate")


class CachedLLMProvider(LLMProvider):
    """Wraps any LLMProvider with in-memory LRU caching for translate/explain."""

    def __init__(self, inner: LLMProvider) -> None:
        self._inner = inner

    async def translate(self, word: str, source_lang: str = "ko", target_lang: str = "en") -> tuple[TranslationResult, dict, bool]:
        key = f"{word.strip().lower()}|{source_lang}|{target_lang}"
        cached = _translation_cache.get(key)
        if cached is not None:
            logger.debug("Translation cache HIT: %s", key)
            return cached, {}, True  # type: ignore[return-value]

        result, usage, _ = await self._inner.translate(word, source_lang, target_lang)
        _translation_cache.put(key, result)
        logger.debug("Translation cache MISS: %s (cache size: %d)", key, _translation_cache.size)
        return result, usage, False

    async def explain_word(self, word: str, translation: str, source_lang: str, target_lang: str) -> tuple[str, dict, bool]:
        key = f"{word.strip().lower()}|{translation.strip().lower()}|{source_lang}|{target_lang}"
        cached = _explanation_cache.get(key)
        if cached is not None:
            logger.debug("Explanation cache HIT: %s", key)
            return cached, {}, True  # type: ignore[return-value]

        result, usage, _ = await self._inner.explain_word(word, translation, source_lang, target_lang)
        _explanation_cache.put(key, result)
        logger.debug("Explanation cache MISS: %s (cache size: %d)", key, _explanation_cache.size)
        return result, usage, False

    async def translate_image(self, image_base64: str, media_type: str, source_lang: str = "ko", target_lang: str = "en") -> tuple[list[TranslationResult], dict]:
        # Image translations are not cached (unique images)
        return await self._inner.translate_image(image_base64, media_type, source_lang, target_lang)


def create_llm_provider() -> LLMProvider:
    """Factory: reads LLM_PROVIDER from config, returns a cached provider."""
    provider = config.LLM_PROVIDER.lower()
    if provider == "anthropic":
        inner = AnthropicProvider()
    elif provider == "openai":
        inner = OpenAIProvider()
    else:
        raise ValueError(f"Unknown LLM provider: {provider!r}. Use 'anthropic' or 'openai'.")
    return CachedLLMProvider(inner)
