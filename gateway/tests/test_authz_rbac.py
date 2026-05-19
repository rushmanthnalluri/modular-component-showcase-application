import jwt
import pytest
from fastapi import HTTPException
from starlette.requests import Request

from gateway.dependencies.security import get_current_principal, require_roles, verify_request_jwt


def test_get_current_principal_accepts_valid_jwt(monkeypatch):
    secret = "test-secret-with-enough-entropy!"
    monkeypatch.setenv("JWT_SECRET", secret)
    token = jwt.encode({"userId": "u1", "email": "user@example.com", "role": "admin"}, secret, algorithm="HS256")

    principal = get_current_principal(token)
    assert principal.user_id == "u1"
    assert principal.role == "admin"


def test_get_current_principal_accepts_backend_access_cookie(monkeypatch):
    secret = "test-secret-with-enough-entropy!"
    monkeypatch.setenv("JWT_SECRET", secret)
    token = jwt.encode(
        {"userId": "u1", "email": "user@example.com", "role": "developer", "tokenType": "access"},
        secret,
        algorithm="HS256",
    )

    principal = get_current_principal(None, None, token)
    assert principal.user_id == "u1"
    assert principal.role == "developer"


def test_get_current_principal_rejects_refresh_token_for_access(monkeypatch):
    secret = "test-secret-with-enough-entropy!"
    monkeypatch.setenv("JWT_SECRET", secret)
    token = jwt.encode({"userId": "u1", "role": "user", "tokenType": "refresh"}, secret, algorithm="HS256")

    with pytest.raises(HTTPException) as exc:
        get_current_principal(None, None, token)

    assert exc.value.status_code == 401


def test_verify_request_jwt_reads_backend_cookie(monkeypatch):
    secret = "test-secret-with-enough-entropy!"
    monkeypatch.setenv("JWT_SECRET", secret)
    token = jwt.encode({"userId": "u1", "role": "admin", "tokenType": "access"}, secret, algorithm="HS256")
    request = Request({
        "type": "http",
        "method": "GET",
        "path": "/api/users/me",
        "headers": [(b"cookie", f"auth_token={token}".encode("utf-8"))],
    })

    principal = verify_request_jwt(request)
    assert principal.user_id == "u1"
    assert principal.role == "admin"


def test_require_roles_blocks_mismatch(monkeypatch):
    secret = "test-secret-with-enough-entropy!"
    monkeypatch.setenv("JWT_SECRET", secret)
    token = jwt.encode({"userId": "u2", "role": "user"}, secret, algorithm="HS256")
    principal = get_current_principal(token)

    dependency = require_roles("admin")
    with pytest.raises(HTTPException) as exc:
        dependency(principal)

    assert exc.value.status_code == 403
