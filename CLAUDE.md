# TiliMiniApp

Telegram Mini App for learning Korean with AI-powered flashcards and SM-2 spaced repetition.

## Tech Stack

- **Backend**: FastAPI + aiosqlite (Python 3.11+), served by uvicorn on port 8000
- **Frontend**: React + TypeScript + Vite on port 5173, Telegram UI components (`@twa-dev/sdk`, `@telegram-apps/telegram-ui`)
- **Bot**: `python-telegram-bot` — /start, /help commands, Mini App menu button
- **LLM**: Anthropic (default) or OpenAI for Korean word translation
- **TTS**: OpenAI `gpt-4o-mini-tts` with `coral` voice, language-specific pronunciation instructions
- **DB**: SQLite with WAL mode
- **Tunnel**: ngrok for exposing the frontend to Telegram

## Architecture

- `bot.py` — Telegram bot entry point (commands, Mini App menu button)
- `backend/` — FastAPI app: routers (`cards`, `practice`, `stats`, `tts`), LLM translation service, TTS service, SM-2 spaced repetition, SQLite via aiosqlite
- `frontend/` — React + TypeScript + Vite, Telegram UI, HashRouter pages (Home, AddCard, Practice, CardsList, Stats)
- `backend/services/tts.py` — TTS service with OpenAI API, SQLite BLOB caching, language-specific instructions
- `backend/routers/tts.py` — `GET /api/tts?text=...&lang=...` endpoint with auth
- `frontend/src/components/SpeakerButton.tsx` — Audio playback with in-memory Blob cache
- `start.sh` / `kill.sh` — Launch and stop all services

## Running

```bash
conda activate tiliminiapp
./start.sh
```

`start.sh` launches ngrok, backend (uvicorn), frontend (vite), and bot, then updates `FRONTEND_URL` in `.env` with the ngrok URL. Press Ctrl+C to stop all.

To kill running instances from another terminal:

```bash
./kill.sh
```

## Logs

Logs are written to `.logs/` (backend.log, frontend.log, bot.log) by `start.sh`.

## TTS (Text-to-Speech)

Pronunciation audio for flashcard words, powered by OpenAI `gpt-4o-mini-tts`.

- **Model**: `gpt-4o-mini-tts` (set via `TTS_MODEL` env var). Must use this model — the older `tts-1` silently ignores the `instructions` parameter, resulting in wrong pronunciation for non-English words.
- **Voice**: `coral` (set via `TTS_VOICE` env var)
- **Instructions**: Language-specific pronunciation guidance passed via the `instructions` parameter (Korean uses Seoul accent, English uses American accent, Russian uses standard accent). Defined in `backend/services/tts.py`.
- **Caching**: Two layers:
  1. **Server-side**: SQLite `tts_cache` table stores audio BLOBs keyed by SHA-256 hash of `text|language|model|voice`. Prevents redundant OpenAI API calls.
  2. **Client-side**: Module-level `Map<string, Blob>` in SpeakerButton.tsx for instant repeat playback within a session. No browser HTTP cache.

### Known Issue: Browser Cache Staleness

When changing the TTS model/voice, be aware of caching at both layers:

1. **Server-side SQLite cache**: The cache key includes `model|voice`, so changing the model automatically causes cache misses and regeneration. Old rows become dead data (harmless, never matched).
2. **Browser HTTP cache**: We previously used `Cache-Control: public, max-age=31536000, immutable` which caused the browser to serve stale audio from the old model indefinitely — even after the backend was updated. **Fix**: Changed to `Cache-Control: no-store` so the browser never caches TTS responses. The in-memory JS `Map<string, Blob>` handles within-session caching instead, which clears naturally on page reload.
3. **`.env` overrides**: The `.env` file values override `config.py` defaults. If `.env` has `TTS_MODEL=tts-1`, the backend uses the old model regardless of what `config.py` says. Always check `.env` when debugging TTS issues.
