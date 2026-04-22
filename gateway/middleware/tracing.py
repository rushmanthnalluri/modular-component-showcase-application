"""Correlation and trace propagation middleware."""

from __future__ import annotations

import uuid
from time import perf_counter

from fastapi import Request


class TracePropagationMiddleware:
    async def __call__(self, request: Request, call_next):
        started_at = perf_counter()
        correlation_id = (
            request.headers.get("x-correlation-id")
            or request.headers.get("x-request-id")
            or str(uuid.uuid4())
        )
        traceparent = request.headers.get("traceparent") or f"00-{uuid.uuid4().hex}{uuid.uuid4().hex[:16]}-{uuid.uuid4().hex[:16]}-01"
        request.state.correlation_id = correlation_id
        request.state.traceparent = traceparent

        response = await call_next(request)
        response.headers["x-correlation-id"] = correlation_id
        response.headers.setdefault("x-request-id", correlation_id)
        response.headers.setdefault("traceparent", traceparent)
        response.headers.setdefault("server-timing", f"gateway;dur={(perf_counter() - started_at) * 1000:.2f}")
        return response
