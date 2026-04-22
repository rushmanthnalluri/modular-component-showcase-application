from fastapi import FastAPI
from fastapi.testclient import TestClient

from gateway.middleware.tracing import TracePropagationMiddleware


def test_trace_header_is_propagated():
    app = FastAPI()
    app.middleware("http")(TracePropagationMiddleware())

    @app.get("/ping")
    async def ping():
        return {"ok": True}

    client = TestClient(app)
    response = client.get("/ping", headers={"x-correlation-id": "cid-123"})
    assert response.status_code == 200
    assert response.headers.get("x-correlation-id") == "cid-123"
