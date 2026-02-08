from __future__ import annotations

from datetime import datetime

import aiosqlite


async def add_flashcard(
    conn: aiosqlite.Connection,
    user_id: int,
    korean: str,
    english: str,
    example_kr: str | None = None,
    example_en: str | None = None,
) -> int:
    """Insert a new flashcard. Returns the new row id."""
    cursor = await conn.execute(
        """
        INSERT INTO flashcards (user_id, korean, english, example_kr, example_en)
        VALUES (?, ?, ?, ?, ?)
        """,
        (user_id, korean, english, example_kr, example_en),
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
    english: str | None = None,
    example_kr: str | None = None,
    example_en: str | None = None,
) -> dict | None:
    """Update editable fields of a flashcard. Returns updated card or None."""
    updates = []
    params = []
    if english is not None:
        updates.append("english = ?")
        params.append(english)
    if example_kr is not None:
        updates.append("example_kr = ?")
        params.append(example_kr)
    if example_en is not None:
        updates.append("example_en = ?")
        params.append(example_en)

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
    korean: str,
) -> bool:
    """Check if user already has a card with this Korean word."""
    cursor = await conn.execute(
        "SELECT 1 FROM flashcards WHERE user_id = ? AND korean = ?",
        (user_id, korean),
    )
    return await cursor.fetchone() is not None
