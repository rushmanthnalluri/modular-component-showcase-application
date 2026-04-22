from fastapi import FastAPI
from fastapi.testclient import TestClient

from gateway.middleware.rate_limit import SlidingWindowRateLimiter


def test_rate_limit_middleware_blocks_after_threshold():
    app = FastAPI()
    app.middleware("http")(SlidingWindowRateLimiter(max_requests=2, window_seconds=60))

    @app.get("/ping")
    async def ping():
        return {"ok": True}

    client = TestClient(app)
    assert client.get("/ping").status_code == 200
    assert client.get("/ping").status_code == 200
    assert client.get("/ping").status_code == 429
