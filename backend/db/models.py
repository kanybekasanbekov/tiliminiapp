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
    part_of_speech: str | None = None,
) -> int:
    """Insert a new flashcard. Returns the new row id."""
    if deck_id is None:
        deck = await get_or_create_default_deck(conn, user_id, language_pair)
        deck_id = deck["id"]
    cursor = await conn.execute(
        """
        INSERT INTO flashcards (user_id, source_text, target_text, example_source, example_target, language_pair, deck_id, part_of_speech)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (user_id, source_text, target_text, example_source, example_target, language_pair, deck_id, part_of_speech),
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
    language_pair: str | None = None,
    deck_id: int | None = None,
) -> list[dict]:
    """Fetch flashcards where next_review <= now, ordered by next_review ASC."""
    where = "WHERE user_id = ? AND next_review <= datetime('now')"
    params: list = [user_id]
    if language_pair is not None:
        where += " AND language_pair = ?"
        params.append(language_pair)
    if deck_id is not None:
        where += " AND deck_id = ?"
        params.append(deck_id)
    cursor = await conn.execute(
        f"""
        SELECT * FROM flashcards
        {where}
        ORDER BY RANDOM()
        LIMIT ?
        """,
        params + [limit],
    )
    rows = await cursor.fetchall()
    return [dict(r) for r in rows]


async def get_all_flashcards(
    conn: aiosqlite.Connection,
    user_id: int,
    offset: int = 0,
    limit: int = 10,
    deck_id: int | None = None,
    language_pair: str | None = None,
) -> tuple[list[dict], int]:
    """Paginated list. Returns (flashcards, total_count). Optionally filter by deck and/or language pair."""
    where = "WHERE user_id = ?"
    params: list = [user_id]
    if deck_id is not None:
        where += " AND deck_id = ?"
        params.append(deck_id)
    if language_pair is not None:
        where += " AND language_pair = ?"
        params.append(language_pair)

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


async def search_flashcards(
    conn: aiosqlite.Connection,
    user_id: int,
    query: str,
    language_pair: str,
    offset: int = 0,
    limit: int = 10,
) -> tuple[list[dict], int]:
    """Search flashcards by source_text or target_text within a language pair. Returns (cards, total_count)."""
    like_param = f"%{query}%"

    cursor = await conn.execute(
        """
        SELECT COUNT(*) as cnt FROM flashcards
        WHERE user_id = ? AND language_pair = ? AND (source_text LIKE ? OR target_text LIKE ?)
        """,
        (user_id, language_pair, like_param, like_param),
    )
    row = await cursor.fetchone()
    total = row["cnt"] if row else 0

    cursor = await conn.execute(
        """
        SELECT f.*, d.name as deck_name
        FROM flashcards f
        JOIN decks d ON f.deck_id = d.id
        WHERE f.user_id = ? AND f.language_pair = ? AND (f.source_text LIKE ? OR f.target_text LIKE ?)
        ORDER BY f.created_at DESC
        LIMIT ? OFFSET ?
        """,
        (user_id, language_pair, like_param, like_param, limit, offset),
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
    language_pair: str | None = None,
    deck_id: int | None = None,
) -> dict:
    """Return stats: total cards, cards due today, interval distribution. Optionally scoped to a language pair and/or deck."""
    extra_filter = ""
    extra_params: tuple = ()
    if language_pair is not None:
        extra_filter += " AND language_pair = ?"
        extra_params += (language_pair,)
    if deck_id is not None:
        extra_filter += " AND deck_id = ?"
        extra_params += (deck_id,)

    cursor = await conn.execute(
        "SELECT COUNT(*) as cnt FROM flashcards WHERE user_id = ?" + extra_filter,
        (user_id,) + extra_params,
    )
    row = await cursor.fetchone()
    total = row["cnt"] if row else 0

    cursor = await conn.execute(
        "SELECT COUNT(*) as cnt FROM flashcards WHERE user_id = ? AND next_review <= datetime('now')" + extra_filter,
        (user_id,) + extra_params,
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
        """ + extra_filter,
        (user_id,) + extra_params,
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


async def get_random_distractors(
    conn: aiosqlite.Connection,
    user_id: int,
    card_id: int,
    language_pair: str,
    side: str,
    count: int = 3,
) -> list[str]:
    """Get random distractor texts for multiple choice quiz.

    Returns up to `count` random texts from other cards in the same language pair,
    excluding cards that have the same text as the correct answer.
    """
    # Get the correct answer text to exclude duplicates
    if side == "target":
        column = "target_text"
    else:
        column = "source_text"

    # Get the correct card's answer text
    cursor = await conn.execute(
        f"SELECT {column} FROM flashcards WHERE id = ? AND user_id = ?",
        (card_id, user_id),
    )
    row = await cursor.fetchone()
    if not row:
        return []
    correct_text = row[column]

    # Get random distractors excluding the current card AND any cards with matching text
    cursor = await conn.execute(
        f"""
        SELECT {column} FROM flashcards
        WHERE user_id = ? AND language_pair = ? AND id != ? AND {column} != ?
        ORDER BY RANDOM()
        LIMIT ?
        """,
        (user_id, language_pair, card_id, correct_text, count),
    )
    rows = await cursor.fetchall()
    return [row[column] for row in rows]


async def check_duplicates_batch(
    conn: aiosqlite.Connection,
    user_id: int,
    source_texts: list[str],
    language_pair: str = "ko-en",
) -> set[str]:
    """Check which source_texts already exist for this user+language_pair. Returns set of duplicates."""
    if not source_texts:
        return set()
    placeholders = ",".join("?" for _ in source_texts)
    cursor = await conn.execute(
        f"SELECT source_text FROM flashcards WHERE user_id = ? AND language_pair = ? AND source_text IN ({placeholders})",
        [user_id, language_pair] + source_texts,
    )
    rows = await cursor.fetchall()
    return {row["source_text"] for row in rows}


async def log_api_usage(
    conn: aiosqlite.Connection,
    user_id: int,
    call_type: str,
    model: str,
    input_tokens: int,
    output_tokens: int,
    estimated_cost_usd: float,
    language_pair: str | None = None,
) -> None:
    """Log an LLM API call for usage tracking."""
    await conn.execute(
        """
        INSERT INTO api_usage (user_id, call_type, model, input_tokens, output_tokens, estimated_cost_usd, language_pair)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (user_id, call_type, model, input_tokens, output_tokens, estimated_cost_usd, language_pair),
    )
    await conn.commit()


async def get_admin_global_stats(conn: aiosqlite.Connection) -> dict:
    """Get global admin statistics across all users."""
    # Total users
    cursor = await conn.execute("SELECT COUNT(*) as cnt FROM users")
    row = await cursor.fetchone()
    total_users = row["cnt"] if row else 0

    # Active users (practiced in last 7 days)
    cursor = await conn.execute(
        "SELECT COUNT(*) as cnt FROM users WHERE last_practice_date >= date('now', '-7 days')"
    )
    row = await cursor.fetchone()
    active_users_7d = row["cnt"] if row else 0

    # New users (registered in last 7 days)
    cursor = await conn.execute(
        "SELECT COUNT(*) as cnt FROM users WHERE created_at >= datetime('now', '-7 days')"
    )
    row = await cursor.fetchone()
    new_users_7d = row["cnt"] if row else 0

    # API usage totals
    cursor = await conn.execute(
        """
        SELECT
            COALESCE(SUM(CASE WHEN call_type = 'translate' THEN 1 ELSE 0 END), 0) as total_translations,
            COALESCE(SUM(CASE WHEN call_type = 'explain' THEN 1 ELSE 0 END), 0) as total_explanations,
            COALESCE(SUM(CASE WHEN call_type = 'translate_image' THEN 1 ELSE 0 END), 0) as total_image_translations,
            COALESCE(SUM(CASE WHEN call_type = 'tts' THEN 1 ELSE 0 END), 0) as total_tts,
            COALESCE(SUM(estimated_cost_usd), 0.0) as total_cost_usd
        FROM api_usage
        """
    )
    row = await cursor.fetchone()

    return {
        "total_users": total_users,
        "active_users_7d": active_users_7d,
        "new_users_7d": new_users_7d,
        "total_translations": row["total_translations"] if row else 0,
        "total_explanations": row["total_explanations"] if row else 0,
        "total_image_translations": row["total_image_translations"] if row else 0,
        "total_tts": row["total_tts"] if row else 0,
        "total_cost_usd": round(row["total_cost_usd"], 6) if row else 0.0,
    }


async def get_admin_user_stats(conn: aiosqlite.Connection) -> list[dict]:
    """Get per-user statistics for admin dashboard."""
    cursor = await conn.execute(
        """
        SELECT
            u.id as user_id,
            u.first_name,
            u.telegram_username as username,
            u.created_at,
            u.last_practice_date as last_active,
            COALESCE(fc.card_count, 0) as total_cards,
            COALESCE(au.translate_count, 0) as total_translations,
            COALESCE(au.explain_count, 0) as total_explanations,
            COALESCE(au.image_translate_count, 0) as total_image_translations,
            COALESCE(au.tts_count, 0) as total_tts,
            COALESCE(au.total_cost, 0.0) as total_cost_usd
        FROM users u
        LEFT JOIN (
            SELECT user_id, COUNT(*) as card_count
            FROM flashcards GROUP BY user_id
        ) fc ON fc.user_id = u.id
        LEFT JOIN (
            SELECT user_id,
                SUM(CASE WHEN call_type = 'translate' THEN 1 ELSE 0 END) as translate_count,
                SUM(CASE WHEN call_type = 'explain' THEN 1 ELSE 0 END) as explain_count,
                SUM(CASE WHEN call_type = 'translate_image' THEN 1 ELSE 0 END) as image_translate_count,
                SUM(CASE WHEN call_type = 'tts' THEN 1 ELSE 0 END) as tts_count,
                SUM(estimated_cost_usd) as total_cost
            FROM api_usage GROUP BY user_id
        ) au ON au.user_id = u.id
        ORDER BY total_cost_usd DESC
        """
    )
    rows = await cursor.fetchall()
    result = []
    for r in rows:
        d = dict(r)
        d["total_cost_usd"] = round(d["total_cost_usd"], 6)
        result.append(d)
    return result


async def log_review(
    conn: aiosqlite.Connection,
    user_id: int,
    card_id: int,
    study_mode: str = "flip",
    was_correct: bool | None = None,
    quality: int = 3,
    response_time_ms: int | None = None,
) -> None:
    """Log a review attempt to review_history."""
    await conn.execute(
        """
        INSERT INTO review_history (user_id, card_id, study_mode, was_correct, quality, response_time_ms)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (user_id, card_id, study_mode,
         int(was_correct) if was_correct is not None else None,
         quality, response_time_ms),
    )
    await conn.commit()


async def get_session_stats(
    conn: aiosqlite.Connection,
    user_id: int,
    since_timestamp: str | None = None,
) -> dict:
    """Get review stats for a session (or all time if no timestamp)."""
    where = "WHERE user_id = ?"
    params: list = [user_id]
    if since_timestamp:
        where += " AND created_at >= ?"
        params.append(since_timestamp)

    cursor = await conn.execute(
        f"""
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN was_correct = 1 THEN 1 ELSE 0 END) as correct,
            SUM(CASE WHEN was_correct = 0 THEN 1 ELSE 0 END) as incorrect
        FROM review_history
        {where} AND was_correct IS NOT NULL
        """,
        params,
    )
    row = await cursor.fetchone()
    total = row["total"] if row else 0
    correct = row["correct"] if row else 0
    incorrect = row["incorrect"] if row else 0
    return {
        "total": total,
        "correct": correct,
        "incorrect": incorrect,
        "accuracy_pct": round(correct / total * 100, 1) if total > 0 else 0,
    }


async def get_accuracy_stats(
    conn: aiosqlite.Connection,
    user_id: int,
    language_pair: str | None = None,
) -> dict:
    """Get accuracy stats per study mode with rolling averages."""
    base_where = "WHERE rh.user_id = ?"
    params: list = [user_id]
    if language_pair:
        base_where += " AND f.language_pair = ?"
        params.append(language_pair)

    # Per-mode stats (all time)
    cursor = await conn.execute(
        f"""
        SELECT
            rh.study_mode,
            COUNT(*) as total,
            SUM(CASE WHEN rh.was_correct = 1 THEN 1 ELSE 0 END) as correct
        FROM review_history rh
        LEFT JOIN flashcards f ON f.id = rh.card_id
        {base_where}
        GROUP BY rh.study_mode
        """,
        params,
    )
    rows = await cursor.fetchall()

    result: dict = {
        "total_reviews": 0,
        "flip_mode": {"total": 0},
        "type_mode": {"total": 0, "correct": 0, "accuracy": 0},
        "quiz_mode": {"total": 0, "correct": 0, "accuracy": 0},
    }

    for row in rows:
        mode = row["study_mode"]
        total = row["total"]
        correct = row["correct"] or 0
        result["total_reviews"] += total
        if mode == "flip":
            result["flip_mode"] = {"total": total}
        elif mode == "type":
            result["type_mode"] = {
                "total": total,
                "correct": correct,
                "accuracy": round(correct / total, 2) if total > 0 else 0,
            }
        elif mode == "quiz":
            result["quiz_mode"] = {
                "total": total,
                "correct": correct,
                "accuracy": round(correct / total, 2) if total > 0 else 0,
            }

    # Rolling averages (7 days and 30 days)
    for days, key in [(7, "last_7_days_accuracy"), (30, "last_30_days_accuracy")]:
        roll_params = list(params)
        cursor = await conn.execute(
            f"""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN rh.was_correct = 1 THEN 1 ELSE 0 END) as correct
            FROM review_history rh
            LEFT JOIN flashcards f ON f.id = rh.card_id
            {base_where} AND rh.was_correct IS NOT NULL
                AND rh.created_at >= datetime('now', '-{days} days')
            """,
            roll_params,
        )
        row = await cursor.fetchone()
        total = row["total"] if row else 0
        correct = row["correct"] if row else 0
        result[key] = round(correct / total, 2) if total > 0 else 0

    return result
