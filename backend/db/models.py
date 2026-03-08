from __future__ import annotations

from datetime import datetime

import aiosqlite


async def get_or_create_user(
    conn: aiosqlite.Connection,
    user_id: int,
    first_name: str | None = None,
    username: str | None = None,
    last_name: str | None = None,
) -> dict:
    """Upsert a user record. Creates if not exists, updates Telegram profile fields."""
    await conn.execute(
        "INSERT OR IGNORE INTO users (id) VALUES (?)",
        (user_id,),
    )

    # Update Telegram profile fields (keep fresh)
    updates = ["updated_at = CURRENT_TIMESTAMP"]
    params: list = []
    if first_name is not None:
        updates.append("first_name = ?")
        params.append(first_name)
    if username is not None:
        updates.append("telegram_username = ?")
        params.append(username)
    if last_name is not None:
        updates.append("last_name = ?")
        params.append(last_name)

    params.append(user_id)
    await conn.execute(
        f"UPDATE users SET {', '.join(updates)} WHERE id = ?",
        params,
    )
    await conn.commit()

    cursor = await conn.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = await cursor.fetchone()
    return dict(row)  # type: ignore[arg-type]


async def get_user(
    conn: aiosqlite.Connection,
    user_id: int,
) -> dict | None:
    """Fetch a user by id."""
    cursor = await conn.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = await cursor.fetchone()
    return dict(row) if row else None


async def update_user_preferences(
    conn: aiosqlite.Connection,
    user_id: int,
    **kwargs: str | int | None,
) -> dict | None:
    """Update user preference fields. Returns updated user or None."""
    allowed = {"active_language_pair", "current_streak", "longest_streak", "last_practice_date"}
    updates = ["updated_at = CURRENT_TIMESTAMP"]
    params: list = []

    for key, value in kwargs.items():
        if key not in allowed:
            continue
        updates.append(f"{key} = ?")
        params.append(value)

    if len(updates) == 1:
        # Only updated_at, nothing meaningful to change
        return await get_user(conn, user_id)

    params.append(user_id)
    await conn.execute(
        f"UPDATE users SET {', '.join(updates)} WHERE id = ?",
        params,
    )
    await conn.commit()
    return await get_user(conn, user_id)


async def add_flashcard(
    conn: aiosqlite.Connection,
    user_id: int,
    source_text: str,
    target_text: str,
    example_source: str | None = None,
    example_target: str | None = None,
    language_pair: str = "ko-en",
) -> int:
    """Insert a new flashcard. Returns the new row id."""
    cursor = await conn.execute(
        """
        INSERT INTO flashcards (user_id, source_text, target_text, example_source, example_target, language_pair)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (user_id, source_text, target_text, example_source, example_target, language_pair),
    )
    await conn.commit()
    return cursor.lastrowid  # type: ignore[return-value]


async def get_flashcard_by_id(
    conn: aiosqlite.Connection,
    flashcard_id: int,
    user_id: int,
) -> dict | None:
    """Fetch a single flashcard by id, scoped to user."""
    cursor = await conn.execute(
        "SELECT * FROM flashcards WHERE id = ? AND user_id = ?",
        (flashcard_id, user_id),
    )
    row = await cursor.fetchone()
    return dict(row) if row else None


async def get_due_flashcards(
    conn: aiosqlite.Connection,
    user_id: int,
    limit: int = 10,
) -> list[dict]:
    """Fetch flashcards where next_review <= now, ordered by next_review ASC."""
    cursor = await conn.execute(
        """
        SELECT * FROM flashcards
        WHERE user_id = ? AND next_review <= datetime('now')
        ORDER BY next_review ASC
        LIMIT ?
        """,
        (user_id, limit),
    )
    rows = await cursor.fetchall()
    return [dict(r) for r in rows]


async def get_all_flashcards(
    conn: aiosqlite.Connection,
    user_id: int,
    offset: int = 0,
    limit: int = 10,
) -> tuple[list[dict], int]:
    """Paginated list. Returns (flashcards, total_count)."""
    cursor = await conn.execute(
        "SELECT COUNT(*) as cnt FROM flashcards WHERE user_id = ?",
        (user_id,),
    )
    row = await cursor.fetchone()
    total = row["cnt"] if row else 0

    cursor = await conn.execute(
        """
        SELECT * FROM flashcards
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
        """,
        (user_id, limit, offset),
    )
    rows = await cursor.fetchall()
    return [dict(r) for r in rows], total


async def update_flashcard(
    conn: aiosqlite.Connection,
    flashcard_id: int,
    user_id: int,
    target_text: str | None = None,
    example_source: str | None = None,
    example_target: str | None = None,
) -> dict | None:
    """Update editable fields of a flashcard. Returns updated card or None."""
    updates = []
    params = []
    if target_text is not None:
        updates.append("target_text = ?")
        params.append(target_text)
    if example_source is not None:
        updates.append("example_source = ?")
        params.append(example_source)
    if example_target is not None:
        updates.append("example_target = ?")
        params.append(example_target)

    if not updates:
        return await get_flashcard_by_id(conn, flashcard_id, user_id)

    params.extend([flashcard_id, user_id])
    await conn.execute(
        f"UPDATE flashcards SET {', '.join(updates)} WHERE id = ? AND user_id = ?",
        params,
    )
    await conn.commit()
    return await get_flashcard_by_id(conn, flashcard_id, user_id)


async def delete_flashcard(
    conn: aiosqlite.Connection,
    flashcard_id: int,
    user_id: int,
) -> bool:
    """Delete by id scoped to user. Returns True if deleted."""
    cursor = await conn.execute(
        "DELETE FROM flashcards WHERE id = ? AND user_id = ?",
        (flashcard_id, user_id),
    )
    await conn.commit()
    return cursor.rowcount > 0


async def update_flashcard_srs(
    conn: aiosqlite.Connection,
    flashcard_id: int,
    ease_factor: float,
    interval_days: int,
    repetitions: int,
    next_review: str,
) -> None:
    """Update SRS fields after a review."""
    await conn.execute(
        """
        UPDATE flashcards
        SET ease_factor = ?, interval_days = ?, repetitions = ?, next_review = ?
        WHERE id = ?
        """,
        (ease_factor, interval_days, repetitions, next_review, flashcard_id),
    )
    await conn.commit()


async def get_user_stats(
    conn: aiosqlite.Connection,
    user_id: int,
) -> dict:
    """Return stats: total cards, cards due today, interval distribution."""
    cursor = await conn.execute(
        "SELECT COUNT(*) as cnt FROM flashcards WHERE user_id = ?",
        (user_id,),
    )
    row = await cursor.fetchone()
    total = row["cnt"] if row else 0

    cursor = await conn.execute(
        """
        SELECT COUNT(*) as cnt FROM flashcards
        WHERE user_id = ? AND next_review <= datetime('now')
        """,
        (user_id,),
    )
    row = await cursor.fetchone()
    due = row["cnt"] if row else 0

    cursor = await conn.execute(
        """
        SELECT
            SUM(CASE WHEN interval_days = 0 THEN 1 ELSE 0 END) as new_count,
            SUM(CASE WHEN interval_days BETWEEN 1 AND 6 THEN 1 ELSE 0 END) as learning_count,
            SUM(CASE WHEN interval_days BETWEEN 7 AND 30 THEN 1 ELSE 0 END) as young_count,
            SUM(CASE WHEN interval_days > 30 THEN 1 ELSE 0 END) as mature_count
        FROM flashcards
        WHERE user_id = ?
        """,
        (user_id,),
    )
    row = await cursor.fetchone()
    distribution = {
        "new": row["new_count"] or 0,
        "learning": row["learning_count"] or 0,
        "young": row["young_count"] or 0,
        "mature": row["mature_count"] or 0,
    } if row else {"new": 0, "learning": 0, "young": 0, "mature": 0}

    return {
        "total": total,
        "due": due,
        "distribution": distribution,
    }


async def check_duplicate(
    conn: aiosqlite.Connection,
    user_id: int,
    source_text: str,
    language_pair: str = "ko-en",
) -> bool:
    """Check if user already has a card with this source text for the given language pair."""
    cursor = await conn.execute(
        "SELECT 1 FROM flashcards WHERE user_id = ? AND source_text = ? AND language_pair = ?",
        (user_id, source_text, language_pair),
    )
    return await cursor.fetchone() is not None
