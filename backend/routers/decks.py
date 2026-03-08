from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from backend.auth import ensure_user
from backend.db import models

router = APIRouter()


class DeckCreateRequest(BaseModel):
    name: str
    description: str = ""
    language_pair: str = "ko-en"


class DeckUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None


class MoveCardRequest(BaseModel):
    card_id: int


@router.get("")
async def list_decks(
    request: Request,
    language_pair: str | None = None,
    user: dict[str, Any] = Depends(ensure_user),
):
    """List user's decks with card counts."""
    db = request.app.state.db
    decks = await models.get_user_decks(db, user["id"], language_pair)
    return {"decks": decks}


@router.post("")
async def create_deck(
    body: DeckCreateRequest,
    request: Request,
    user: dict[str, Any] = Depends(ensure_user),
):
    """Create a new deck."""
    db = request.app.state.db
    deck_id = await models.create_deck(
        db, user["id"], body.name, body.description, body.language_pair
    )
    deck = await models.get_deck(db, deck_id, user["id"])
    return deck


@router.get("/{deck_id}")
async def get_deck(
    deck_id: int,
    request: Request,
    user: dict[str, Any] = Depends(ensure_user),
):
    """Get a single deck."""
    db = request.app.state.db
    deck = await models.get_deck(db, deck_id, user["id"])
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    return deck


@router.put("/{deck_id}")
async def update_deck(
    deck_id: int,
    body: DeckUpdateRequest,
    request: Request,
    user: dict[str, Any] = Depends(ensure_user),
):
    """Update a deck's name and/or description."""
    db = request.app.state.db
    deck = await models.update_deck(db, deck_id, user["id"], body.name, body.description)
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    return deck


@router.delete("/{deck_id}")
async def delete_deck(
    deck_id: int,
    request: Request,
    user: dict[str, Any] = Depends(ensure_user),
):
    """Delete a deck. Cards are moved to the default deck."""
    db = request.app.state.db
    try:
        deleted = await models.delete_deck(db, deck_id, user["id"])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not deleted:
        raise HTTPException(status_code=404, detail="Deck not found")
    return {"deleted": True}


@router.post("/{deck_id}/move-card")
async def move_card(
    deck_id: int,
    body: MoveCardRequest,
    request: Request,
    user: dict[str, Any] = Depends(ensure_user),
):
    """Move a card to a different deck."""
    db = request.app.state.db
    moved = await models.move_card_to_deck(db, body.card_id, deck_id, user["id"])
    if not moved:
        raise HTTPException(status_code=404, detail="Card or deck not found")
    return {"moved": True}
