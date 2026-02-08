import aiosqlite

_SCHEMA = """
CREATE TABLE IF NOT EXISTS flashcards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    korean TEXT NOT NULL,
    english TEXT NOT NULL,
    example_kr TEXT,
    example_en TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_review TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ease_factor REAL DEFAULT 2.5,
    interval_days INTEGER DEFAULT 0,
    repetitions INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_user_review ON flashcards(user_id, next_review);
CREATE INDEX IF NOT EXISTS idx_user_korean ON flashcards(user_id, korean);
"""


async def init_db(db_path: str) -> aiosqlite.Connection:
    """Open the database, enable WAL mode, and create schema if needed."""
    conn = await aiosqlite.connect(db_path)
    conn.row_factory = aiosqlite.Row
    await conn.execute("PRAGMA journal_mode=WAL")
    await conn.execute("PRAGMA busy_timeout=5000")
    await conn.execute("PRAGMA synchronous=NORMAL")
    await conn.execute("PRAGMA cache_size=-2000")
    await conn.execute("PRAGMA temp_store=MEMORY")
    await conn.executescript(_SCHEMA)
    await conn.commit()
    return conn


async def close_db(conn: aiosqlite.Connection) -> None:
    """Close the database connection."""
    await conn.close()
