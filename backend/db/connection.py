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
    repetitions INTEGER DEFAULT 0,
    deck_id INTEGER NOT NULL DEFAULT 0
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

_DECKS_SCHEMA = """
CREATE TABLE IF NOT EXISTS decks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    language_pair TEXT NOT NULL DEFAULT 'ko-en',
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

_EXPLANATIONS_SCHEMA = """
CREATE TABLE IF NOT EXISTS explanations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    explanation TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES flashcards(id) ON DELETE CASCADE
);
"""

_API_USAGE_SCHEMA = """
CREATE TABLE IF NOT EXISTS api_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    call_type TEXT NOT NULL,
    model TEXT NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    estimated_cost_usd REAL DEFAULT 0.0,
    language_pair TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

_INDEXES = """
CREATE INDEX IF NOT EXISTS idx_user_review ON flashcards(user_id, next_review);
CREATE INDEX IF NOT EXISTS idx_user_source ON flashcards(user_id, language_pair, source_text);
CREATE INDEX IF NOT EXISTS idx_deck_user ON decks(user_id, language_pair);
CREATE INDEX IF NOT EXISTS idx_flashcard_deck ON flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_explanation_card ON explanations(card_id);
CREATE INDEX IF NOT EXISTS idx_user_lang_review ON flashcards(user_id, language_pair, next_review);
CREATE INDEX IF NOT EXISTS idx_api_usage_user ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_created ON api_usage(created_at);
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


async def _run_migration_3(conn: aiosqlite.Connection) -> None:
    """Migration 3: Create decks table, backfill defaults, add deck_id to flashcards."""
    cursor = await conn.execute("SELECT 1 FROM schema_versions WHERE version = 3")
    if await cursor.fetchone():
        return

    # Create default decks for all existing users
    await conn.execute(
        """
        INSERT INTO decks (user_id, name, language_pair, is_default)
        SELECT DISTINCT id, 'Default', 'ko-en', 1 FROM users
        WHERE id NOT IN (SELECT user_id FROM decks WHERE is_default = 1)
        """
    )

    # Check if flashcards table already has deck_id (fresh install)
    cursor = await conn.execute("PRAGMA table_info(flashcards)")
    columns = {row[1] for row in await cursor.fetchall()}
    if "deck_id" not in columns:
        # CREATE-COPY-DROP-RENAME to add deck_id NOT NULL
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
                repetitions INTEGER DEFAULT 0,
                deck_id INTEGER NOT NULL DEFAULT 0
            );

            INSERT INTO flashcards_new
                (id, user_id, source_text, target_text, example_source, example_target,
                 language_pair, created_at, next_review, ease_factor, interval_days, repetitions, deck_id)
            SELECT
                f.id, f.user_id, f.source_text, f.target_text, f.example_source, f.example_target,
                f.language_pair, f.created_at, f.next_review, f.ease_factor, f.interval_days, f.repetitions,
                COALESCE(d.id, 0)
            FROM flashcards f
            LEFT JOIN decks d ON d.user_id = f.user_id AND d.is_default = 1;

            DROP TABLE flashcards;

            ALTER TABLE flashcards_new RENAME TO flashcards;

            CREATE INDEX idx_user_review ON flashcards(user_id, next_review);
            CREATE INDEX idx_user_source ON flashcards(user_id, language_pair, source_text);
            CREATE INDEX idx_flashcard_deck ON flashcards(deck_id);
        """)

    await conn.execute(
        "INSERT INTO schema_versions (version, description) VALUES (3, 'add decks table and deck_id to flashcards')"
    )
    await conn.commit()


async def _run_migration_4(conn: aiosqlite.Connection) -> None:
    """Migration 4: Add preferred_deck_id to users table."""
    cursor = await conn.execute("SELECT 1 FROM schema_versions WHERE version = 4")
    if await cursor.fetchone():
        return

    cursor = await conn.execute("PRAGMA table_info(users)")
    columns = {row[1] for row in await cursor.fetchall()}
    if "preferred_deck_id" not in columns:
        await conn.execute(
            "ALTER TABLE users ADD COLUMN preferred_deck_id INTEGER DEFAULT NULL"
        )

    await conn.execute(
        "INSERT INTO schema_versions (version, description) VALUES (4, 'add preferred_deck_id to users')"
    )
    await conn.commit()


async def _run_migration_5(conn: aiosqlite.Connection) -> None:
    """Migration 5: Create explanations table."""
    cursor = await conn.execute("SELECT 1 FROM schema_versions WHERE version = 5")
    if await cursor.fetchone():
        return

    await conn.executescript(_EXPLANATIONS_SCHEMA)
    await conn.execute(
        "INSERT INTO schema_versions (version, description) VALUES (5, 'create explanations table')"
    )
    await conn.commit()


async def _run_migration_6(conn: aiosqlite.Connection) -> None:
    """Migration 6: Create api_usage table."""
    cursor = await conn.execute("SELECT 1 FROM schema_versions WHERE version = 6")
    if await cursor.fetchone():
        return

    await conn.executescript(_API_USAGE_SCHEMA)
    await conn.execute(
        "INSERT INTO schema_versions (version, description) VALUES (6, 'create api_usage table')"
    )
    await conn.commit()


async def _run_migration_7(conn: aiosqlite.Connection) -> None:
    """Migration 7: Backfill api_usage from existing flashcards and explanations."""
    cursor = await conn.execute("SELECT 1 FROM schema_versions WHERE version = 7")
    if await cursor.fetchone():
        return

    # Each saved flashcard represents at least one translate call
    await conn.execute(
        """
        INSERT INTO api_usage (user_id, call_type, model, input_tokens, output_tokens, estimated_cost_usd, language_pair, created_at)
        SELECT user_id, 'translate', 'unknown', 0, 0, 0.0, language_pair, created_at
        FROM flashcards
        """
    )

    # Each explanation represents one explain call
    await conn.execute(
        """
        INSERT INTO api_usage (user_id, call_type, model, input_tokens, output_tokens, estimated_cost_usd, language_pair, created_at)
        SELECT e.user_id, 'explain', 'unknown', 0, 0, 0.0, f.language_pair, e.created_at
        FROM explanations e
        JOIN flashcards f ON f.id = e.card_id
        """
    )

    await conn.execute(
        "INSERT INTO schema_versions (version, description) VALUES (7, 'backfill api_usage from flashcards and explanations')"
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
    await conn.executescript(_DECKS_SCHEMA)
    await conn.executescript(_API_USAGE_SCHEMA)
    await _run_migrations(conn)
    await _run_migration_2(conn)
    await _run_migration_3(conn)
    await _run_migration_4(conn)
    await _run_migration_5(conn)
    await _run_migration_6(conn)
    await _run_migration_7(conn)
    await conn.executescript(_INDEXES)
    await conn.commit()
    return conn


async def close_db(conn: aiosqlite.Connection) -> None:
    """Close the database connection."""
    await conn.close()
