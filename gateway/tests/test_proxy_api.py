"""Tests for gateway /api passthrough proxy behavior."""

import sys
from pathlib import Path

from fastapi.testclient import TestClient

# Add parent directory to path for relative imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from gateway.main import app
except ImportError:
    from main import app


class _FakeAsyncResponse:
    def __init__(self, status_code=200, content=b"{}", headers=None):
        self.status_code = status_code
        self.content = content
        self.headers = headers or {"content-type": "application/json"}


class _FakeAsyncClient:
    def __init__(self, *args, **kwargs):
        self.args = args
        self.kwargs = kwargs

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        return False

    async def request(self, method, url, headers=None, params=None, content=None):
        assert method in ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]
        assert "/api/health" in url
        assert headers is not None
        assert headers.get("accept-encoding") == "identity"
        assert headers.get("authorization") == "Bearer fake-token"
        assert headers.get("content-type") == "application/json"
        assert headers.get("x-request-id") == "req-123"
        assert "origin" not in {key.lower() for key in headers.keys()}
        return _FakeAsyncResponse(
            status_code=200,
            content=b'{"ok":true}',
            headers={
                "content-type": "application/json",
                "set-cookie": "auth_token=fake; Path=/; HttpOnly",
            },
        )


def test_proxy_api_forwards_and_preserves_set_cookie(monkeypatch):
    import gateway.main as gateway_main

    monkeypatch.setattr(gateway_main.httpx, "AsyncClient", _FakeAsyncClient)

    client = TestClient(app)
    response = client.post(
        "/api/health",
        headers={"authorization": "Bearer fake-token", "content-type": "application/json", "x-request-id": "req-123"},
        json={"probe": True},
    )

    assert response.status_code == 200
    assert response.json()["ok"] is True
    assert response.json()["success"] is True
    assert "set-cookie" in response.headers
    assert response.headers.get("x-request-id") == "req-123"
