"""Tests for routing and app initialization."""
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


def test_root_endpoint(client):
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data
    assert "status" in data


def test_status_endpoint(client):
    """Test status endpoint."""
    response = client.get("/status")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] == "operational"


def test_cors_headers(client):
    """Test CORS headers are present."""
    response = client.get("/", headers={"Origin": "http://localhost:8080"})
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:8080"


def test_404_on_invalid_path(client):
    """Test 404 on invalid path."""
    response = client.get("/invalid/path")
    assert response.status_code == 404


def test_authentication_routes_exist(client):
    """Test authentication routes exist."""
    response = client.get("/authservice/csrf")
    assert response.status_code in [200, 500]


def test_search_routes_exist(client):
    """Test search routes exist."""
    response = client.get("/searchservice/health")
    assert response.status_code in [200, 500]


def test_sql_routes_exist(client):
    """Test SQL routes exist."""
    response = client.get("/sqlservice/components")
    assert response.status_code in [200, 500, 422]


def test_health_routes_exist(client):
    """Test health routes exist."""
    response = client.get("/health")
    assert response.status_code in [200, 500]


def test_auth_register_alias_exists(client):
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
    assert response.status_code in [200, 500, 422]


def test_sql_users_alias_exists(client):
    response = client.get("/sqlservice/users")
    assert response.status_code in [200, 500, 422]
