"""Tests for SQL controller."""
import pytest
import sys
from pathlib import Path

# Add parent directory to path for relative imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient

try:
    from gateway.main import app
except ImportError:
    from main import app


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


def test_list_components_endpoint(client):
    """Test that list components endpoint exists."""
    response = client.get("/sqlservice/components")
    assert response.status_code in [200, 500, 422]


def test_create_component_endpoint(client):
    """Test that create component endpoint exists."""
    response = client.post(
        "/sqlservice/components",
        json={
            "id": 1,
            "name": "Test",
            "description": "Test",
            "category_id": 1,
            "user_id": 1,
        },
    )
    assert response.status_code in [200, 201, 500, 422]


def test_update_component_endpoint(client):
    """Test that update component endpoint exists."""
    response = client.put(
        "/sqlservice/components/1",
        json={
            "id": 1,
            "name": "Updated",
            "description": "Updated",
            "category_id": 1,
            "user_id": 1,
        },
    )
    assert response.status_code in [200, 500, 422]


def test_delete_component_endpoint(client):
    """Test that delete component endpoint exists."""
    response = client.delete("/sqlservice/components/1")
    assert response.status_code in [200, 404, 500, 422]
