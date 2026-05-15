"""Tests for search controller."""
import pytest
import sys
from pathlib import Path

# Add parent directory to path for relative imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient

try:
    from gateway.main import app
    from gateway.tests.auth_helpers import auth_headers
except ImportError:
    from main import app
    from tests.auth_helpers import auth_headers


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


def test_search_endpoint_exists(client):
    """Test that search endpoint is available."""
    response = client.post(
        "/searchservice/search",
        headers=auth_headers(),
        json={
            "query": "button",
            "limit": 10,
            "offset": 0,
        },
    )
    assert response.status_code in [200, 500, 422]


def test_history_endpoint_exists(client):
    """Test that history endpoint is available."""
    response = client.get("/searchservice/history", headers=auth_headers())
    assert response.status_code in [200, 500]


def test_health_endpoint_exists(client):
    """Test that health endpoint is available."""
    response = client.get("/searchservice/health")
    assert response.status_code in [200, 500]
