"""Simple in-memory rate limit middleware for gateway ingress hardening."""

from __future__ import annotations

import time
from collections import defaultdict, deque

from fastapi import Request
from fastapi.responses import JSONResponse


class SlidingWindowRateLimiter:
    def __init__(self, max_requests: int = 300, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._events = defaultdict(deque)

    def _key(self, request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        client_ip = forwarded or (request.client.host if request.client else "unknown")
        return client_ip

    async def __call__(self, request: Request, call_next):
        key = self._key(request)
        current = time.time()
        events = self._events[key]

        while events and (current - events[0]) > self.window_seconds:
            events.popleft()

        remaining = max(self.max_requests - len(events), 0)
        if len(events) >= self.max_requests:
            return JSONResponse(
                status_code=429,
                content={"message": "Gateway rate limit exceeded"},
                headers={
                    "x-ratelimit-limit": str(self.max_requests),
                    "x-ratelimit-remaining": "0",
                    "x-ratelimit-window-seconds": str(self.window_seconds),
                },
            )

        events.append(current)
        response = await call_next(request)
        response.headers["x-ratelimit-limit"] = str(self.max_requests)
        response.headers["x-ratelimit-remaining"] = str(max(remaining - 1, 0))
        response.headers["x-ratelimit-window-seconds"] = str(self.window_seconds)
        return response
