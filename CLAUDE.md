# TiliMiniApp

Telegram Mini App for learning Korean with AI-powered flashcards and SM-2 spaced repetition.

## Tech Stack

- **Backend**: FastAPI + aiosqlite (Python 3.11+), served by uvicorn on port 8000
- **Frontend**: React + TypeScript + Vite on port 5173, Telegram UI components (`@twa-dev/sdk`, `@telegram-apps/telegram-ui`)
- **Bot**: `python-telegram-bot` — /start, /help commands, Mini App menu button
- **LLM**: Anthropic (default) or OpenAI for Korean word translation
- **DB**: SQLite with WAL mode
- **Tunnel**: ngrok for exposing the frontend to Telegram

## Architecture

- `bot.py` — Telegram bot entry point (commands, Mini App menu button)
- `backend/` — FastAPI app: routers (`cards`, `practice`, `stats`), LLM translation service, SM-2 spaced repetition, SQLite via aiosqlite
- `frontend/` — React + TypeScript + Vite, Telegram UI, HashRouter pages (Home, AddCard, Practice, CardsList, Stats)
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
