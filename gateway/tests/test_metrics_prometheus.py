from fastapi.testclient import TestClient

from gateway.main import app


def test_metrics_endpoint_supports_prometheus_format():
    client = TestClient(app)
    response = client.get("/metrics?format=prometheus", headers={"accept": "text/plain"})
    assert response.status_code == 200
    assert "# HELP gateway_requests_total" in response.text
    assert "gateway_uptime_seconds" in response.text
