"""Tests for authentication controller."""
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


def test_signup_endpoint_exists(client):
    """Test that signup endpoint is available."""
    response = client.post(
        "/authservice/signup",
        json={
            "fullName": "Test User",
            "email": "test@example.com",
            "phone": "1234567890",
            "password": "password123",
            "confirmPassword": "password123",
        },
    )
    # Endpoint exists (may fail due to backend unavailability, which is OK for this test)
    assert response.status_code in [200, 500, 422]


def test_signin_endpoint_exists(client):
    """Test that signin endpoint is available."""
    response = client.post(
        "/authservice/signin",
        json={
            "email": "test@example.com",
            "password": "password123",
        },
    )
    assert response.status_code in [200, 500, 422]


def test_csrf_endpoint_exists(client):
    """Test that CSRF endpoint is available."""
    response = client.get("/authservice/csrf")
    assert response.status_code in [200, 500]


def test_logout_endpoint_exists(client):
    """Test that logout endpoint is available."""
    response = client.post("/authservice/logout")
    assert response.status_code in [200, 500]
