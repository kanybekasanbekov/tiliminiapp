"""Lightweight Telegram bot entry point for TiliMiniApp.

Handles /start and /help commands, and sets up the menu button
to launch the Mini App. Does not duplicate any backend logic.
"""

from __future__ import annotations

import logging

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, MenuButtonWebApp, Update, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes

from backend import config

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=getattr(logging, config.LOG_LEVEL, logging.INFO),
)
logger = logging.getLogger(__name__)


async def post_init(application: Application) -> None:
    """Set the menu button to open the Mini App."""
    webapp_url = config.FRONTEND_URL
    await application.bot.set_chat_menu_button(
        menu_button=MenuButtonWebApp(text="Open Tili", web_app=WebAppInfo(url=webapp_url)),
    )
    logger.info("Menu button set to: %s", webapp_url)


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /start — welcome message with a button to open the Mini App."""
    if not update.message:
        return

    webapp_url = config.FRONTEND_URL
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("Open Tili", web_app=WebAppInfo(url=webapp_url))],
    ])

    await update.message.reply_text(
        "Welcome to Tili! Learn Korean with AI-powered flashcards.\n\n"
        "Tap the button below to open the app:",
        reply_markup=keyboard,
    )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /help — usage instructions."""
    if not update.message:
        return

    await update.message.reply_text(
        "Tili - Korean Flashcard Mini App\n\n"
        "How to use:\n"
        "1. Tap 'Open Tili' to launch the app\n"
        "2. Add Korean words — AI translates them instantly\n"
        "3. Practice with spaced repetition flashcards\n"
        "4. Track your progress in Statistics\n\n"
        "The app uses the SM-2 algorithm (same as Anki) to schedule reviews.",
    )


def main() -> None:
    """Start the bot."""
    if not config.TELEGRAM_BOT_TOKEN:
        raise ValueError("TELEGRAM_BOT_TOKEN not set in .env")
    if not config.FRONTEND_URL or config.FRONTEND_URL == "https://your-frontend-domain.com":
        raise ValueError(
            "FRONTEND_URL not set in .env. Set it to your ngrok URL or production domain."
        )

    application = (
        Application.builder()
        .token(config.TELEGRAM_BOT_TOKEN)
        .post_init(post_init)
        .build()
    )

    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("help", help_command))

    logger.info("Bot starting (Mini App URL: %s)...", config.FRONTEND_URL)
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
