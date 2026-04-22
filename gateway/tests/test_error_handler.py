from fastapi import FastAPI
from fastapi.testclient import TestClient

from gateway.middleware.error_handler import unhandled_exception_handler


def test_error_handler_returns_structured_payload():
    app = FastAPI()
    app.add_exception_handler(Exception, unhandled_exception_handler)

    @app.get("/boom")
    async def boom():
        raise RuntimeError("boom")

    client = TestClient(app, raise_server_exceptions=False)
    response = client.get("/boom")
    assert response.status_code == 500
    payload = response.json()
    assert payload["message"] == "Gateway request failed."
    assert "detail" in payload
