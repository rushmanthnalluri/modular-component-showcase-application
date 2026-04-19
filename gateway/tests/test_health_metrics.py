"""Tests for structured gateway health and metrics behavior."""

import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Add parent directory to path for relative imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from gateway.main import app
    from gateway.controllers import healthController
except ImportError:
    from main import app
    from controllers import healthController


class _FakeClient:
    def __init__(self, payload):
        self.payload = payload

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        return False

    async def get(self, path):
        return self.payload


@pytest.fixture
def client():
    healthController.reset_metrics()
    return TestClient(app)


def test_health_and_metrics_are_structured(client, monkeypatch):
    async def fake_check_service(name, base_url, path="/health"):
        return {
            "service": name,
            "status": "up",
            "response_time_ms": 1.23,
            "error_message": None,
        }

    monkeypatch.setattr(healthController, "_check_service", fake_check_service)
    monkeypatch.setattr(healthController, "get_service_client", lambda base_url: _FakeClient({"status": "ok", "mongo": True, "postgres": True}))

    health_response = client.get("/health")
    assert health_response.status_code == 200
    health_payload = health_response.json()
    assert health_payload["status"] in ["healthy", "degraded", "unhealthy"]
    assert isinstance(health_payload["services"], list)
    assert health_payload["services"][0]["service"] == "backend"

    metrics_response = client.get("/metrics")
    assert metrics_response.status_code == 200
    metrics_payload = metrics_response.json()
    assert metrics_payload["request_count"] >= 2
    assert "downstream_service_availability" in metrics_payload
    assert metrics_payload["downstream_service_availability"]["backend"] == "up"
