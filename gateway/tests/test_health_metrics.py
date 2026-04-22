"""Tests for structured gateway health and metrics behavior."""

import sys
from pathlib import Path
import logging

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


class _FailingClient:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        return False

    async def get(self, path):
        raise RuntimeError("database host gateway-db.internal is unreachable")


@pytest.mark.asyncio
async def test_check_service_sanitizes_dependency_errors(monkeypatch, caplog):
    monkeypatch.setattr(healthController, "get_service_client", lambda base_url: _FailingClient())

    with caplog.at_level(logging.ERROR):
        payload = await healthController._check_service("backend", "http://backend.internal")

    assert payload["status"] == "down"
    assert payload["error_message"] == healthController.DEPENDENCY_UNAVAILABLE_MESSAGE
    assert "gateway-db.internal" not in payload["error_message"]
    assert "Downstream health check failed" in caplog.text


def test_health_endpoint_hides_internal_exception_details(client, monkeypatch):
    async def failing_check_service(name, base_url, path="/health"):
        raise RuntimeError("token validation failed for backend.internal")

    monkeypatch.setattr(healthController, "_check_service", failing_check_service)

    response = client.get("/health")

    assert response.status_code == 500
    assert response.json()["detail"] == healthController.HEALTH_CHECK_FAILED_MESSAGE
    assert "backend.internal" not in response.json()["detail"]


def test_metrics_endpoint_hides_internal_exception_details(client, monkeypatch):
    monkeypatch.setattr(healthController, "snapshot_metrics", lambda include_current_request=False: (_ for _ in ()).throw(RuntimeError("redis://metrics-internal failed")))

    response = client.get("/metrics")

    assert response.status_code == 500
    assert response.json()["detail"] == healthController.UNEXPECTED_INTERNAL_ERROR_MESSAGE
    assert "metrics-internal" not in response.json()["detail"]
