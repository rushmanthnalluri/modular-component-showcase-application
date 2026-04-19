"""FastAPI application initialization and configuration."""
import logging
import sys
import os
import time
from pathlib import Path
import httpx

# Add gateway directory to path for imports to work in container
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

try:
    # Import from package structure (when run as `uvicorn gateway.main:app`)
    from gateway.utils.env import settings
    from gateway.controllers import (
        authenticationController,
        searchController,
        healthController,
        sqlController,
        componentController,
    )
    from gateway.controllers.healthController import record_request_metric
except ImportError:
    # Import with relative paths (when run in container)
    from utils.env import settings
    from controllers import (
        authenticationController,
        searchController,
        healthController,
        sqlController,
        componentController,
    )
    from controllers.healthController import record_request_metric

# Configure logging
logging.basicConfig(level=settings.log_level.upper())
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Modular Component Showcase Gateway",
    description="API Gateway for component showcase backend services",
    version="1.0.0",
    debug=settings.debug,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, exc: Exception):
    logger.exception("Unhandled gateway exception")
    return JSONResponse(
        status_code=500,
        content={"message": "Gateway request failed.", "detail": str(exc)},
    )


@app.middleware("http")
async def collect_request_metrics(request, call_next):
    started_at = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - started_at) * 1000
    record_request_metric(duration_ms, response.status_code)
    return response

# Register routers
app.include_router(authenticationController.router)
app.include_router(searchController.router)
app.include_router(healthController.router)
app.include_router(sqlController.router)
app.include_router(componentController.router)


@app.get("/")
async def root():
    """Gateway root endpoint.
    
    Returns:
        Gateway info
    """
    return {
        "message": "Modular Component Showcase Gateway",
        "version": "1.0.0",
        "status": "running",
        "backend_url": settings.backend_url,
        "frontend_url": settings.frontend_url,
    }


@app.get("/status")
async def status():
    """Gateway status endpoint.
    
    Returns:
        Gateway status
    """
    return {
        "status": "operational",
        "gateway_host": settings.gateway_host,
        "gateway_port": settings.gateway_port,
        "debug": settings.debug,
    }


@app.api_route("/api/{full_path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"])
async def proxy_api(full_path: str, request: Request):
    """Forward all /api/* traffic to backend while preserving cookies and query params."""
    target_url = f"{settings.backend_url.rstrip('/')}/api/{full_path}"
    body = await request.body()
    query_params = dict(request.query_params)

    outbound_headers = {
        key: value
        for key, value in request.headers.items()
        if key.lower() not in {"host", "content-length", "origin", "referer"}
    }
    # Ask backend for uncompressed payloads so the proxy always relays decodable JSON/text bodies.
    outbound_headers["accept-encoding"] = "identity"

    timeout = httpx.Timeout(settings.request_timeout_seconds)
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        backend_response = await client.request(
            method=request.method,
            url=target_url,
            headers=outbound_headers,
            params=query_params,
            content=body if body else None,
        )

    response_headers = {}
    set_cookie = backend_response.headers.get("set-cookie")
    if set_cookie:
        response_headers["set-cookie"] = set_cookie

    content_type = backend_response.headers.get("content-type", "application/json")
    return Response(
        content=backend_response.content,
        status_code=backend_response.status_code,
        media_type=content_type,
        headers=response_headers,
    )


if __name__ == "__main__":
    import uvicorn
    
    logger.info(f"Starting gateway on {settings.gateway_host}:{settings.gateway_port}")
    logger.info(f"Backend URL: {settings.backend_url}")
    logger.info(f"CORS Origins: {settings.cors_origins}")
    
    uvicorn.run(
        "gateway.main:app",
        host=settings.gateway_host,
        port=settings.gateway_port,
        reload=settings.debug,
    )
