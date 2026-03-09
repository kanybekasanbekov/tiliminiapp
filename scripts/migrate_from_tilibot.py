#!/usr/bin/env python3
"""One-time migration: copy tilibot DB and run tiliminiapp migrations.

Usage:
    conda activate tiliminiapp
    python scripts/migrate_from_tilibot.py

This script:
1. Verifies the copied DB has the old schema (korean/english columns)
2. Runs init_db() which triggers migrations 1-5 to restructure the schema
3. Verifies the migration succeeded
"""
import asyncio
import os
import sqlite3
import sys

# Add project root to path so we can import backend
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.db.connection import init_db, close_db

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "flashcards.db")


def verify_old_schema(db_path: str) -> bool:
    """Check that the DB has the old tilibot schema before migration."""
    conn = sqlite3.connect(db_path)
    cursor = conn.execute("PRAGMA table_info(flashcards)")
    columns = {row[1] for row in cursor.fetchall()}
    conn.close()

    if "korean" in columns and "english" in columns:
        print("[OK] Old schema detected (korean/english columns)")
        return True
    elif "source_text" in columns and "target_text" in columns:
        print("[INFO] New schema already in place (source_text/target_text columns)")
        print("       Migrations may have already been applied.")
        return True
    else:
        print(f"[ERROR] Unexpected columns: {columns}")
        return False


async def run_migration():
    print(f"Database path: {DB_PATH}")
    print(f"Database size: {os.path.getsize(DB_PATH)} bytes")
    print()

    # Step 1: Verify old schema
    print("=== Step 1: Verify schema ===")
    if not verify_old_schema(DB_PATH):
        sys.exit(1)

    # Step 2: Count rows before migration
    print()
    print("=== Step 2: Pre-migration counts ===")
    conn_raw = sqlite3.connect(DB_PATH)
    cursor = conn_raw.execute("SELECT COUNT(*) FROM flashcards")
    card_count = cursor.fetchone()[0]
    print(f"  Flashcards: {card_count}")

    cursor = conn_raw.execute("SELECT user_id, COUNT(*) FROM flashcards GROUP BY user_id")
    for row in cursor.fetchall():
        print(f"  User {row[0]}: {row[1]} cards")
    conn_raw.close()

    # Step 3: Run init_db (triggers all migrations)
    print()
    print("=== Step 3: Running migrations via init_db() ===")
    conn = await init_db(DB_PATH)

    # Step 4: Verify migration
    print()
    print("=== Step 4: Post-migration verification ===")

    # Check flashcards count
    cursor = await conn.execute("SELECT COUNT(*) as cnt FROM flashcards")
    row = await cursor.fetchone()
    new_count = row["cnt"]
    status = "OK" if new_count == card_count else "FAIL"
    print(f"  [{status}] Flashcards: {new_count} (expected {card_count})")

    # Check column names
    cursor = await conn.execute("PRAGMA table_info(flashcards)")
    columns = {row[1] for row in await cursor.fetchall()}
    has_new = "source_text" in columns and "target_text" in columns
    has_old = "korean" not in columns and "english" not in columns
    status = "OK" if has_new and has_old else "FAIL"
    print(f"  [{status}] Columns renamed: source_text={has_new}, korean_removed={has_old}")

    # Check language_pair
    cursor = await conn.execute("SELECT DISTINCT language_pair FROM flashcards")
    pairs = [row["language_pair"] for row in await cursor.fetchall()]
    status = "OK" if pairs == ["ko-en"] else "FAIL"
    print(f"  [{status}] Language pairs: {pairs}")

    # Check users table
    cursor = await conn.execute("SELECT COUNT(*) as cnt FROM users")
    row = await cursor.fetchone()
    user_count = row["cnt"]
    status = "OK" if user_count == 3 else "FAIL"
    print(f"  [{status}] Users: {user_count} (expected 3)")

    cursor = await conn.execute("SELECT id FROM users ORDER BY id")
    user_ids = [row["id"] for row in await cursor.fetchall()]
    print(f"         User IDs: {user_ids}")

    # Check decks table
    cursor = await conn.execute("SELECT COUNT(*) as cnt FROM decks WHERE is_default = 1")
    row = await cursor.fetchone()
    deck_count = row["cnt"]
    status = "OK" if deck_count == 3 else "FAIL"
    print(f"  [{status}] Default decks: {deck_count} (expected 3)")

    # Check deck_id assignments
    cursor = await conn.execute(
        "SELECT COUNT(*) as cnt FROM flashcards WHERE deck_id = 0 OR deck_id IS NULL"
    )
    row = await cursor.fetchone()
    orphan_count = row["cnt"]
    status = "OK" if orphan_count == 0 else "FAIL"
    print(f"  [{status}] Orphan cards (no deck): {orphan_count} (expected 0)")

    # Check schema versions
    cursor = await conn.execute("SELECT version, description FROM schema_versions ORDER BY version")
    versions = await cursor.fetchall()
    version_nums = [row["version"] for row in versions]
    status = "OK" if version_nums == [1, 2, 3, 4, 5] else "FAIL"
    print(f"  [{status}] Schema versions: {version_nums}")
    for v in versions:
        print(f"         v{v['version']}: {v['description']}")

    # Spot-check SM-2 preservation (card id=1)
    cursor = await conn.execute(
        "SELECT id, source_text, ease_factor, interval_days, repetitions, next_review, created_at "
        "FROM flashcards WHERE id = 1"
    )
    card = await cursor.fetchone()
    if card:
        print()
        print("=== Spot check: Card #1 ===")
        print(f"  source_text:   {card['source_text']}")
        print(f"  ease_factor:   {card['ease_factor']} (expected 1.3)")
        print(f"  interval_days: {card['interval_days']} (expected 8)")
        print(f"  repetitions:   {card['repetitions']} (expected 3)")
        print(f"  next_review:   {card['next_review']}")
        print(f"  created_at:    {card['created_at']}")

        sm2_ok = (
            card["source_text"] == "\ucc28\uac11\ub2e4"
            and card["ease_factor"] == 1.3
            and card["interval_days"] == 8
            and card["repetitions"] == 3
        )
        status = "OK" if sm2_ok else "FAIL"
        print(f"  [{status}] SM-2 values preserved")

    # Check explanations table exists
    cursor = await conn.execute("SELECT COUNT(*) as cnt FROM explanations")
    row = await cursor.fetchone()
    print(f"\n  [OK] Explanations table ready ({row['cnt']} entries)")

    await close_db(conn)

    print()
    print("=" * 50)
    print("Migration complete!")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(run_migration())
