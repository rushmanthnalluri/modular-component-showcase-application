"""Shared authentication helpers for gateway route tests."""

from __future__ import annotations

import jwt
import os


TEST_JWT_SECRET = "development-secret-for-gateway-tests"


def auth_headers(role: str = "admin") -> dict[str, str]:
    os.environ["JWT_SECRET"] = TEST_JWT_SECRET
    token = jwt.encode(
        {"userId": "test-user", "email": "test@example.com", "role": role},
        TEST_JWT_SECRET,
        algorithm="HS256",
    )
    return {"Authorization": f"Bearer {token}"}
