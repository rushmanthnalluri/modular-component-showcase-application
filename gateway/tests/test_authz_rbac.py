import jwt
import pytest
from fastapi import HTTPException

from gateway.dependencies.security import get_current_principal, require_roles


def test_get_current_principal_accepts_valid_jwt(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-secret")
    token = jwt.encode({"userId": "u1", "email": "user@example.com", "role": "admin"}, "test-secret", algorithm="HS256")

    principal = get_current_principal(token)
    assert principal.user_id == "u1"
    assert principal.role == "admin"


def test_require_roles_blocks_mismatch(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-secret")
    token = jwt.encode({"userId": "u2", "role": "user"}, "test-secret", algorithm="HS256")
    principal = get_current_principal(token)

    dependency = require_roles("admin")
    with pytest.raises(HTTPException) as exc:
        dependency(principal)

    assert exc.value.status_code == 403
