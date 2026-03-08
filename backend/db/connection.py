import aiosqlite

_SCHEMA = """
CREATE TABLE IF NOT EXISTS flashcards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    source_text TEXT NOT NULL,
    target_text TEXT NOT NULL,
    example_source TEXT,
    example_target TEXT,
    language_pair TEXT NOT NULL DEFAULT 'ko-en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_review TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ease_factor REAL DEFAULT 2.5,
    interval_days INTEGER DEFAULT 0,
    repetitions INTEGER DEFAULT 0
);
"""

_USERS_SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    telegram_username TEXT,
    first_name TEXT,
    last_name TEXT,
    active_language_pair TEXT DEFAULT 'ko-en',
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_practice_date TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

_INDEXES = """
CREATE INDEX IF NOT EXISTS idx_user_review ON flashcards(user_id, next_review);
CREATE INDEX IF NOT EXISTS idx_user_source ON flashcards(user_id, language_pair, source_text);
"""

_MIGRATION_SETUP = """
CREATE TABLE IF NOT EXISTS schema_versions (
    version INTEGER PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);
"""


async def _run_migrations(conn: aiosqlite.Connection) -> None:
    await conn.executescript(_MIGRATION_SETUP)

    # Check if migration 1 already applied
    cursor = await conn.execute("SELECT 1 FROM schema_versions WHERE version = 1")
    if await cursor.fetchone():
        return

    # Check if old schema exists (korean column present)
    cursor = await conn.execute("PRAGMA table_info(flashcards)")
    columns = {row[1] for row in await cursor.fetchall()}
    if "korean" not in columns:
        # Fresh install with new schema — just mark as done
        await conn.execute(
            "INSERT INTO schema_versions (version, description) VALUES (1, 'rename columns to language-agnostic')"
        )
        await conn.commit()
        return

    # CREATE-COPY-DROP-RENAME migration
    await conn.executescript("""
        CREATE TABLE flashcards_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            source_text TEXT NOT NULL,
            target_text TEXT NOT NULL,
            example_source TEXT,
            example_target TEXT,
            language_pair TEXT NOT NULL DEFAULT 'ko-en',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            next_review TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ease_factor REAL DEFAULT 2.5,
            interval_days INTEGER DEFAULT 0,
            repetitions INTEGER DEFAULT 0
        );

        INSERT INTO flashcards_new
            (id, user_id, source_text, target_text, example_source, example_target,
             language_pair, created_at, next_review, ease_factor, interval_days, repetitions)
        SELECT
            id, user_id, korean, english, example_kr, example_en,
            'ko-en', created_at, next_review, ease_factor, interval_days, repetitions
        FROM flashcards;

        DROP TABLE flashcards;

        ALTER TABLE flashcards_new RENAME TO flashcards;

        CREATE INDEX idx_user_review ON flashcards(user_id, next_review);
        CREATE INDEX idx_user_source ON flashcards(user_id, language_pair, source_text);
    """)

    await conn.execute(
        "INSERT INTO schema_versions (version, description) VALUES (1, 'rename columns to language-agnostic')"
    )
    await conn.commit()


async def _run_migration_2(conn: aiosqlite.Connection) -> None:
    """Migration 2: Create users table and backfill from flashcards."""
    cursor = await conn.execute("SELECT 1 FROM schema_versions WHERE version = 2")
    if await cursor.fetchone():
        return

    # Backfill existing users from flashcard data
    await conn.execute(
        "INSERT OR IGNORE INTO users (id) SELECT DISTINCT user_id FROM flashcards"
    )
    await conn.execute(
        "INSERT INTO schema_versions (version, description) VALUES (2, 'create users table and backfill')"
    )
    await conn.commit()


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
    await conn.executescript(_USERS_SCHEMA)
    await _run_migrations(conn)
    await _run_migration_2(conn)
    await conn.executescript(_INDEXES)
    await conn.commit()
    return conn


async def close_db(conn: aiosqlite.Connection) -> None:
    """Close the database connection."""
    await conn.close()
