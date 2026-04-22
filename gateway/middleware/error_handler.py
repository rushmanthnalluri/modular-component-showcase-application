"""Centralized error handling helper for gateway."""

from __future__ import annotations

import logging

from fastapi import Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


async def unhandled_exception_handler(request: Request, exc: Exception):
    correlation_id = getattr(request.state, "correlation_id", "")
    logger.exception("Unhandled gateway exception", extra={"correlation_id": correlation_id})
    return JSONResponse(
        status_code=500,
        content={
            "message": "Gateway request failed.",
            "detail": str(exc),
            "correlationId": correlation_id,
            "path": request.url.path,
            "method": request.method,
        },
    )
