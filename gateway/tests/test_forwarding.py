"""Tests for gateway controller forwarding behavior."""

import sys
from pathlib import Path

from fastapi.testclient import TestClient

# Add parent directory to path for relative imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from gateway.main import app
    from gateway.controllers import authenticationController, sqlController
except ImportError:
    from main import app
    from controllers import authenticationController, sqlController


def test_auth_register_alias_forwards(monkeypatch):
    async def fake_signup(payload):
        return {"ok": True, "email": payload["email"]}

    monkeypatch.setattr(authenticationController.AuthService, "signup", fake_signup)

    client = TestClient(app)
    response = client.post(
        "/authservice/register",
        json={
            "fullName": "Test User",
            "email": "test@example.com",
            "phone": "1234567890",
            "password": "password123",
            "confirmPassword": "password123",
        },
    )

    assert response.status_code == 200
    assert response.json()["ok"] is True


def test_sql_users_alias_forwards(monkeypatch):
    async def fake_list_users():
        return {"items": [{"id": 1, "name": "Admin"}]}

    monkeypatch.setattr(sqlController.SQLService, "list_users", fake_list_users)

    client = TestClient(app)
    response = client.get("/sqlservice/users")

    assert response.status_code == 200
    assert response.json()["items"][0]["name"] == "Admin"