from __future__ import annotations

from datetime import datetime, timedelta

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
    allowed = {"active_language_pair", "current_streak", "longest_streak", "last_practice_date", "preferred_deck_id"}
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


async def get_or_create_default_deck(
    conn: aiosqlite.Connection,
    user_id: int,
    language_pair: str = "ko-en",
) -> dict:
    """Get the user's default deck for a language pair, creating it if needed."""
    cursor = await conn.execute(
        "SELECT * FROM decks WHERE user_id = ? AND language_pair = ? AND is_default = 1",
        (user_id, language_pair),
    )
    row = await cursor.fetchone()
    if row:
        return dict(row)

    cursor = await conn.execute(
        """
        INSERT INTO decks (user_id, name, language_pair, is_default)
        VALUES (?, 'Default', ?, 1)
        """,
        (user_id, language_pair),
    )
    await conn.commit()
    cursor = await conn.execute("SELECT * FROM decks WHERE id = ?", (cursor.lastrowid,))
    row = await cursor.fetchone()
    return dict(row)  # type: ignore[arg-type]


async def create_deck(
    conn: aiosqlite.Connection,
    user_id: int,
    name: str,
    description: str = "",
    language_pair: str = "ko-en",
) -> int:
    """Create a new (non-default) deck. Returns the new deck id."""
    cursor = await conn.execute(
        """
        INSERT INTO decks (user_id, name, description, language_pair, is_default)
        VALUES (?, ?, ?, ?, 0)
        """,
        (user_id, name, description, language_pair),
    )
    await conn.commit()
    return cursor.lastrowid  # type: ignore[return-value]


async def get_user_decks(
    conn: aiosqlite.Connection,
    user_id: int,
    language_pair: str | None = None,
) -> list[dict]:
    """List user's decks with card counts. Default deck appears first."""
    query = """
        SELECT d.*, COUNT(f.id) as card_count
        FROM decks d
        LEFT JOIN flashcards f ON f.deck_id = d.id
        WHERE d.user_id = ?
    """
    params: list = [user_id]
    if language_pair is not None:
        query += " AND d.language_pair = ?"
        params.append(language_pair)
    query += " GROUP BY d.id ORDER BY d.is_default DESC, d.created_at ASC"

    cursor = await conn.execute(query, params)
    rows = await cursor.fetchall()
    return [dict(r) for r in rows]


async def get_deck(
    conn: aiosqlite.Connection,
    deck_id: int,
    user_id: int,
) -> dict | None:
    """Fetch a single deck by id, scoped to user."""
    cursor = await conn.execute(
        "SELECT * FROM decks WHERE id = ? AND user_id = ?",
        (deck_id, user_id),
    )
    row = await cursor.fetchone()
    return dict(row) if row else None


async def update_deck(
    conn: aiosqlite.Connection,
    deck_id: int,
    user_id: int,
    name: str | None = None,
    description: str | None = None,
) -> dict | None:
    """Update a deck's name and/or description. Returns updated deck or None."""
    updates = ["updated_at = CURRENT_TIMESTAMP"]
    params: list = []
    if name is not None:
        updates.append("name = ?")
        params.append(name)
    if description is not None:
        updates.append("description = ?")
        params.append(description)

    if len(updates) == 1:
        return await get_deck(conn, deck_id, user_id)

    params.extend([deck_id, user_id])
    await conn.execute(
        f"UPDATE decks SET {', '.join(updates)} WHERE id = ? AND user_id = ?",
        params,
    )
    await conn.commit()
    return await get_deck(conn, deck_id, user_id)


async def delete_deck(
    conn: aiosqlite.Connection,
    deck_id: int,
    user_id: int,
) -> bool:
    """Delete a deck, moving its cards to the default deck. Cannot delete the default deck."""
    deck = await get_deck(conn, deck_id, user_id)
    if not deck:
        return False
    if deck["is_default"]:
        raise ValueError("Cannot delete the default deck")

    # Find the default deck for this language pair
    default = await get_or_create_default_deck(conn, user_id, deck["language_pair"])

    # Move cards to the default deck
    await conn.execute(
        "UPDATE flashcards SET deck_id = ? WHERE deck_id = ? AND user_id = ?",
        (default["id"], deck_id, user_id),
    )
    await conn.execute(
        "DELETE FROM decks WHERE id = ? AND user_id = ?",
        (deck_id, user_id),
    )
    await conn.commit()
    return True


async def move_card_to_deck(
    conn: aiosqlite.Connection,
    card_id: int,
    deck_id: int,
    user_id: int,
) -> bool:
    """Move a flashcard to a different deck. Both must belong to the user."""
    # Verify deck belongs to user
    deck = await get_deck(conn, deck_id, user_id)
    if not deck:
        return False

    cursor = await conn.execute(
        "UPDATE flashcards SET deck_id = ? WHERE id = ? AND user_id = ?",
        (deck_id, card_id, user_id),
    )
    await conn.commit()
    return cursor.rowcount > 0


async def add_flashcard(
    conn: aiosqlite.Connection,
    user_id: int,
    source_text: str,
    target_text: str,
    example_source: str | None = None,
    example_target: str | None = None,
    language_pair: str = "ko-en",
    deck_id: int | None = None,
) -> int:
    """Insert a new flashcard. Returns the new row id."""
    if deck_id is None:
        deck = await get_or_create_default_deck(conn, user_id, language_pair)
        deck_id = deck["id"]
    cursor = await conn.execute(
        """
        INSERT INTO flashcards (user_id, source_text, target_text, example_source, example_target, language_pair, deck_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (user_id, source_text, target_text, example_source, example_target, language_pair, deck_id),
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
    deck_id: int | None = None,
) -> tuple[list[dict], int]:
    """Paginated list. Returns (flashcards, total_count). Optionally filter by deck."""
    where = "WHERE user_id = ?"
    params: list = [user_id]
    if deck_id is not None:
        where += " AND deck_id = ?"
        params.append(deck_id)

    cursor = await conn.execute(
        f"SELECT COUNT(*) as cnt FROM flashcards {where}",
        params,
    )
    row = await cursor.fetchone()
    total = row["cnt"] if row else 0

    cursor = await conn.execute(
        f"""
        SELECT * FROM flashcards
        {where}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
        """,
        params + [limit, offset],
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
    await delete_explanations_for_card(conn, flashcard_id)
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


async def update_streak(
    conn: aiosqlite.Connection,
    user_id: int,
) -> None:
    """Update the user's daily practice streak."""
    user = await get_user(conn, user_id)
    if not user:
        return

    today = datetime.now().strftime("%Y-%m-%d")
    last = user["last_practice_date"]
    current = user["current_streak"] or 0
    longest = user["longest_streak"] or 0

    if last == today:
        return  # already practiced today

    if last:
        last_date = datetime.strptime(last, "%Y-%m-%d")
        today_date = datetime.strptime(today, "%Y-%m-%d")
        if today_date - last_date == timedelta(days=1):
            current += 1
        else:
            current = 1
    else:
        current = 1

    longest = max(longest, current)
    await update_user_preferences(
        conn, user_id,
        current_streak=current,
        longest_streak=longest,
        last_practice_date=today,
    )


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

    user = await get_user(conn, user_id)
    return {
        "total": total,
        "due": due,
        "distribution": distribution,
        "current_streak": user["current_streak"] if user else 0,
        "longest_streak": user["longest_streak"] if user else 0,
        "last_practice_date": user["last_practice_date"] if user else None,
    }


async def get_explanation(
    conn: aiosqlite.Connection,
    card_id: int,
    user_id: int,
) -> dict | None:
    """Fetch cached explanation for a card, scoped to user."""
    cursor = await conn.execute(
        "SELECT * FROM explanations WHERE card_id = ? AND user_id = ?",
        (card_id, user_id),
    )
    row = await cursor.fetchone()
    return dict(row) if row else None


async def save_explanation(
    conn: aiosqlite.Connection,
    card_id: int,
    user_id: int,
    explanation: str,
) -> dict:
    """Insert or replace explanation for a card."""
    await conn.execute(
        "INSERT OR REPLACE INTO explanations (card_id, user_id, explanation) VALUES (?, ?, ?)",
        (card_id, user_id, explanation),
    )
    await conn.commit()
    cursor = await conn.execute(
        "SELECT * FROM explanations WHERE card_id = ? AND user_id = ?",
        (card_id, user_id),
    )
    row = await cursor.fetchone()
    return dict(row)  # type: ignore[arg-type]


async def delete_explanations_for_card(
    conn: aiosqlite.Connection,
    card_id: int,
) -> None:
    """Delete explanation when card is deleted."""
    await conn.execute("DELETE FROM explanations WHERE card_id = ?", (card_id,))


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
