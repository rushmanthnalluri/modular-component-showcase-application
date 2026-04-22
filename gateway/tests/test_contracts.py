from fastapi.testclient import TestClient

from gateway.main import app


def test_openapi_contract_contains_core_paths():
    client = TestClient(app)
    response = client.get("/openapi.json")
    assert response.status_code == 200

    body = response.json()
    paths = body.get("paths", {})
    assert "/health" in paths
    assert "/status" in paths
    assert "/readyz" in paths
    assert "/livez" in paths
    assert "/api/{full_path}" not in paths
