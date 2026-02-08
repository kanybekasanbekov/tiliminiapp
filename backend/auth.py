from __future__ import annotations

import hashlib
import hmac
import json
import time
from typing import Any
from urllib.parse import parse_qs, unquote

from fastapi import Depends, HTTPException, Request, status

from backend import config


def validate_init_data(init_data: str, bot_token: str) -> bool:
    """Validate Telegram Mini App initData using HMAC-SHA256.

    Algorithm per Telegram docs:
    1. Parse URL-encoded initData
    2. Extract and remove 'hash'
    3. Sort remaining params alphabetically
    4. Join as 'key=value' with newline separator
    5. secret_key = HMAC-SHA256(key=b"WebAppData", msg=bot_token)
    6. computed = HMAC-SHA256(key=secret_key, msg=data_check_string)
    7. Compare computed with extracted hash
    """
    parsed = parse_qs(init_data, keep_blank_values=True)

    hash_value = parsed.pop("hash", [None])[0]
    if not hash_value:
        return False

    # Build data-check-string: sorted key=value pairs joined by newline
    # parse_qs returns lists, take first value for each key
    items = []
    for key in sorted(parsed.keys()):
        value = parsed[key][0]
        items.append(f"{key}={value}")
    data_check_string = "\n".join(items)

    # Create secret key: HMAC-SHA256(key="WebAppData", msg=bot_token)
    secret_key = hmac.new(
        b"WebAppData",
        bot_token.encode(),
        hashlib.sha256,
    ).digest()

    # Compute hash: HMAC-SHA256(key=secret_key, msg=data_check_string)
    computed_hash = hmac.new(
        secret_key,
        data_check_string.encode(),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(computed_hash, hash_value)


def parse_init_data(init_data: str) -> dict[str, Any]:
    """Parse initData and extract user information."""
    parsed = parse_qs(init_data, keep_blank_values=True)
    result: dict[str, Any] = {}

    for key, values in parsed.items():
        value = values[0]
        if key in ("user", "receiver", "chat"):
            try:
                result[key] = json.loads(unquote(value))
            except json.JSONDecodeError:
                result[key] = value
        else:
            result[key] = value

    return result


async def get_current_user(request: Request) -> dict[str, Any]:
    """FastAPI dependency: extract and validate Telegram user from initData.

    Expects header: Authorization: tma <initData>
    """
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("tma "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header. Expected: tma <initData>",
        )

    init_data_raw = auth_header[4:]

    # Validate signature
    if not validate_init_data(init_data_raw, config.TELEGRAM_BOT_TOKEN):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid initData signature",
        )

    # Check expiration (1 hour)
    parsed = parse_qs(init_data_raw, keep_blank_values=True)
    auth_date_str = parsed.get("auth_date", [None])[0]
    if auth_date_str:
        try:
            auth_date = int(auth_date_str)
            if time.time() - auth_date > 3600:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="initData has expired",
                )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid auth_date",
            )

    # Extract user
    data = parse_init_data(init_data_raw)
    user = data.get("user")
    if not user or not isinstance(user, dict) or "id" not in user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User data not found in initData",
        )

    return user
