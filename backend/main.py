from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend import config
from backend.db.connection import close_db, init_db
from backend.services.llm import create_llm_provider

logger = logging.getLogger(__name__)

logging.basicConfig(level=getattr(logging, config.LOG_LEVEL, logging.INFO))


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle: init and cleanup resources."""
    # Startup
    logger.info("Initializing database at %s", config.DATABASE_PATH)
    app.state.db = await init_db(config.DATABASE_PATH)

    logger.info("Creating LLM provider: %s", config.LLM_PROVIDER)
    app.state.llm = create_llm_provider()

    logger.info("Application ready")
    yield

    # Shutdown
    logger.info("Shutting down...")
    await close_db(app.state.db)


app = FastAPI(
    title="TiliMiniApp API",
    description="AI-powered Korean flashcard learning Telegram Mini App",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routers
from backend.routers import cards, practice, stats  # noqa: E402

app.include_router(cards.router, prefix="/api/cards", tags=["cards"])
app.include_router(practice.router, prefix="/api/practice", tags=["practice"])
app.include_router(stats.router, prefix="/api/stats", tags=["stats"])


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
