from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta

DIFFICULTY_TO_QUALITY: dict[str, int] = {
    "easy": 5,
    "medium": 3,
    "hard": 1,
}


def difficulty_to_quality(difficulty: str) -> int:
    """Map a difficulty string to an SM-2 quality rating."""
    return DIFFICULTY_TO_QUALITY[difficulty.lower()]


@dataclass
class SRSResult:
    """Result of an SM-2 calculation."""

    ease_factor: float
    interval_days: int
    repetitions: int
    next_review: datetime


def calculate_srs(
    quality: int,
    current_ease: float,
    current_interval: int,
    current_reps: int,
) -> SRSResult:
    """Apply the SM-2 spaced repetition algorithm.

    Args:
        quality: 0-5 rating (Easy=5, Medium=3, Hard=1).
        current_ease: Current ease factor (>= 1.3).
        current_interval: Current interval in days.
        current_reps: Current number of consecutive correct reviews.

    Returns:
        SRSResult with updated values and next review datetime.
    """
    # Update ease factor
    new_ease = current_ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    new_ease = max(1.3, new_ease)

    if quality >= 3:  # Correct response
        if current_reps == 0:
            if quality == 5:  # Easy — 1 day
                new_interval = 1
                next_review = datetime.utcnow() + timedelta(days=1)
            else:  # Medium — 5 hours
                new_interval = 0
                next_review = datetime.utcnow() + timedelta(hours=5)
        elif current_reps == 1:
            new_interval = 6
            next_review = datetime.utcnow() + timedelta(days=6)
        else:
            new_interval = round(current_interval * new_ease)
            next_review = datetime.utcnow() + timedelta(days=new_interval)
        new_reps = current_reps + 1
    else:  # Hard — reset and review again in 10 minutes
        new_interval = 0
        new_reps = 0
        next_review = datetime.utcnow() + timedelta(minutes=10)

    return SRSResult(
        ease_factor=round(new_ease, 4),
        interval_days=new_interval,
        repetitions=new_reps,
        next_review=next_review,
    )
