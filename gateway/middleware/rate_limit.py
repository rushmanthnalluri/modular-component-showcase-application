"""Distributed Redis rate limit middleware for gateway ingress hardening."""

from __future__ import annotations

import os
import time
from collections import defaultdict, deque
import redis.asyncio as redis

from fastapi import Request
from fastapi.responses import JSONResponse

REDIS_URL = os.environ.get("REDIS_URL", "")

class SlidingWindowRateLimiter:
    def __init__(self, max_requests: int = 300, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._events = defaultdict(deque)
        self.redis_client = redis.from_url(REDIS_URL) if REDIS_URL else None

    def _key(self, request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        client_ip = forwarded or (request.client.host if request.client else "unknown")
        return client_ip

    async def __call__(self, request: Request, call_next):
        key = self._key(request)
        current = time.time()
        
        # Redis implementation
        if self.redis_client:
            try:
                redis_key = f"rate_limit:{key}"
                # Remove old events
                await self.redis_client.zremrangebyscore(redis_key, 0, current - self.window_seconds)
                # Count current
                count = await self.redis_client.zcard(redis_key)
                
                if count >= self.max_requests:
                    return JSONResponse(
                        status_code=429,
                        content={"message": "Gateway rate limit exceeded"},
                        headers={
                            "x-ratelimit-limit": str(self.max_requests),
                            "x-ratelimit-remaining": "0",
                            "x-ratelimit-window-seconds": str(self.window_seconds),
                        },
                    )
                
                # Add current event
                await self.redis_client.zadd(redis_key, {str(current): current})
                await self.redis_client.expire(redis_key, self.window_seconds)
                
                response = await call_next(request)
                response.headers["x-ratelimit-limit"] = str(self.max_requests)
                response.headers["x-ratelimit-remaining"] = str(max(self.max_requests - count - 1, 0))
                response.headers["x-ratelimit-window-seconds"] = str(self.window_seconds)
                return response
            except Exception as e:
                # Fallback to memory if Redis fails
                pass

        # In-memory fallback
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
