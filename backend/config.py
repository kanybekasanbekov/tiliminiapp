from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from project root (parent of backend/)
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path, override=True)

# Telegram Bot Token
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")

# Database
DATABASE_PATH = os.getenv("DATABASE_PATH", "database/flashcards.db")

# LLM Provider Configuration
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai").lower()

# API Keys
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Model Selection
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4.1-mini")

# Frontend URL for CORS
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://your-frontend-domain.com")

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Admin User ID (Telegram user ID)
ADMIN_USER_ID = int(os.getenv("ADMIN_USER_ID", "0"))

# Supported language pairs
SUPPORTED_LANGUAGE_PAIRS = {"ko-en", "en-ko", "ko-ru", "en-ru"}

# TTS Configuration
TTS_MODEL = os.getenv("TTS_MODEL", "gpt-4o-mini-tts")
TTS_VOICE = os.getenv("TTS_VOICE", "coral")
