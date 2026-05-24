"""FastAPI application initialization and configuration."""
import gzip
import json
import logging
import sys
import os
import time
import zlib
from pathlib import Path
import httpx

# Add gateway directory to path for imports to work in container
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

try:
    # Import from package structure (when run as `uvicorn gateway.main:app`)
    from gateway.utils.env import settings, validate_runtime_environment
    from gateway.controllers import (
        authenticationController,
        searchController,
        healthController,
        sqlController,
        componentController,
        springController,
    )
    from gateway.controllers.healthController import record_request_metric
    from gateway.middleware.rate_limit import SlidingWindowRateLimiter
    from gateway.middleware.tracing import TracePropagationMiddleware
    from gateway.middleware.error_handler import unhandled_exception_handler as gateway_unhandled_exception_handler
    from gateway.dependencies.security import verify_request_jwt
except ImportError:
    # Import with relative paths (when run in container)
    from utils.env import settings, validate_runtime_environment
    from controllers import (
        authenticationController,
        searchController,
        healthController,
        sqlController,
        componentController,
        springController,
    )
    from controllers.healthController import record_request_metric
    from middleware.rate_limit import SlidingWindowRateLimiter
    from middleware.tracing import TracePropagationMiddleware
    from middleware.error_handler import unhandled_exception_handler as gateway_unhandled_exception_handler
    from dependencies.security import verify_request_jwt

# Configure logging
logging.basicConfig(level=settings.log_level.upper())
logger = logging.getLogger(__name__)
validate_runtime_environment()

# Create FastAPI app
app = FastAPI(
    title="Modular Component Showcase Gateway",
    description="API Gateway for component showcase backend services with tracing, rate limiting, and downstream health aggregation",
    version="1.0.0",
    debug=settings.debug,
)

# Add CORS middleware
# Production-safe config: explicit origins + credentials + preflight support.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "X-CSRF-Token",
        "x-csrf-token",
        "X-Requested-With",
        "Accept",
        "Accept-Language",
        "X-Correlation-Id",
        "X-Request-Id",
    ],
)





@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, exc: Exception):
    return await gateway_unhandled_exception_handler(_request, exc)


app.middleware("http")(TracePropagationMiddleware())
app.middleware("http")(SlidingWindowRateLimiter(max_requests=500, window_seconds=60))


@app.middleware("http")
async def limit_request_body_size(request: Request, call_next):
    # Allow larger multipart uploads (avatars up to 5MB). Make configurable via env
    max_content_length = int(os.getenv("GATEWAY_MAX_CONTENT_LENGTH", str(6_000_000)))
    content_length = request.headers.get("content-length")
    if content_length and content_length.isdigit() and int(content_length) > max_content_length:
        return JSONResponse(
            status_code=413,
            content={"success": False, "message": "Request payload too large.", "code": "PAYLOAD_TOO_LARGE"},
        )

    return await call_next(request)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers.setdefault("x-content-type-options", "nosniff")
    response.headers.setdefault("x-frame-options", "DENY")
    response.headers.setdefault("referrer-policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("x-gateway-name", "modular-component-showcase")
    return response


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
app.include_router(springController.router)

# ----------------------------
# Frontend compatibility aliases
# ----------------------------
# The frontend expects these legacy/top-level paths under /api/*.
# Upstream controllers are mounted under service-specific prefixes
# (e.g. /authservice, /springservice, /sqlservice). These aliases forward
# requests into the generic /api proxy.

from fastapi import Response as _Response


def _forward_to_backend(full_path: str, request: Request):

    """Use the same proxy logic as /api/{full_path}.

    Implemented as an internal call to avoid route drift.
    """
    return proxy_api(full_path=full_path, request=request)


def _forward_captcha_to_backend(full_path: str, request: Request, backend_prefix: str = "captcha"):
    """Forward captcha aliases into the backend captcha route."""
    suffix = str(full_path or "").strip("/")
    captcha_path = backend_prefix if not suffix else f"{backend_prefix}/{suffix}"
    return proxy_api(full_path=captcha_path, request=request)


@app.api_route("/api/profile", methods=["GET", "PUT", "PATCH", "OPTIONS", "HEAD"], include_in_schema=False)
async def api_profile(request: Request):
    # Spring service holds user profile + dashboard.
    return await _forward_to_backend("profile", request)


@app.api_route("/api/dashboard", methods=["GET", "OPTIONS", "HEAD"], include_in_schema=False)
async def api_dashboard(request: Request):
    return await _forward_to_backend("dashboard", request)


@app.api_route("/api/captcha", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"], include_in_schema=False)
async def api_captcha_root(request: Request):
    return await _forward_captcha_to_backend("", request, "captcha")


@app.api_route(
    "/api/captcha/{full_path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    include_in_schema=False,
)
async def api_captcha_proxy(request: Request, full_path: str):
    return await _forward_captcha_to_backend(full_path, request, "captcha")


@app.api_route("/api/auth/captcha", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"], include_in_schema=False)
async def api_auth_captcha_root(request: Request):
    return await _forward_captcha_to_backend("", request, "auth/captcha")


@app.api_route(
    "/api/auth/captcha/{full_path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    include_in_schema=False,
)
async def api_auth_captcha_proxy(request: Request, full_path: str):
    return await _forward_captcha_to_backend(full_path, request, "auth/captcha")


@app.api_route(
    "/api/admin/sql/{full_path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    include_in_schema=False,
)
async def api_admin_sql_proxy(request: Request, full_path: str):
    # Map /api/admin/sql/* -> /api/sqlservice/* or /api/sql/* depending on backend.
    # We forward to the backend path the SQL service controller expects.
    return await _forward_to_backend(f"sql/{full_path}", request)


@app.api_route("/api/admin/sql", methods=["GET", "OPTIONS", "HEAD"], include_in_schema=False)
async def api_admin_sql_root(request: Request):
    return await _forward_to_backend("sql", request)


def _forward_vector_search_to_backend(full_path: str, request: Request):
    """Forward vector-search aliases into the backend vector router."""
    suffix = str(full_path or "").strip("/")
    vector_path = "vector" if not suffix else f"vector/{suffix}"
    return proxy_api(full_path=vector_path, request=request)


@app.api_route("/api/vector-search", methods=["GET", "POST", "OPTIONS", "HEAD"], include_in_schema=False)
async def api_vector_search_root(request: Request):
    if request.method.upper() == "GET":
        return await _forward_vector_search_to_backend("providers/capabilities", request)
    return await _forward_vector_search_to_backend("", request)


@app.api_route(
    "/api/vector-search/{full_path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    include_in_schema=False,
)
async def api_vector_search_proxy(request: Request, full_path: str):
    return await _forward_vector_search_to_backend(full_path, request)



PUBLIC_API_PREFIXES = ("auth", "health", "readyz", "livez", "captcha", "email")
PUBLIC_API_READ_PREFIXES = (
    "components",
    "reviews",
    "discussions",
    "search",
    "vector/providers/capabilities",
    "vector-search",
)
PUBLIC_API_SEARCH_PATHS = {
    "search",
    "mongo/search",
    "mongo/search/semantic",
    "vector/search/semantic",
    "vector/search/hybrid",
}


def _is_public_api_route(full_path: str, method: str) -> bool:
    path = str(full_path or "").strip("/").lower()
    http_method = method.upper()
    if not path:
        return True

    if any(path == prefix or path.startswith(f"{prefix}/") for prefix in PUBLIC_API_PREFIXES):
        return True

    if http_method in {"GET", "HEAD", "OPTIONS"}:
        return any(path == prefix or path.startswith(f"{prefix}/") for prefix in PUBLIC_API_READ_PREFIXES)

    if http_method == "POST" and path in PUBLIC_API_SEARCH_PATHS:
        return True

    return False


def _decode_json_payload(content: bytes, headers: dict) -> dict | list | None:
    """Decode backend JSON payloads, including compressed variants."""
    if not content:
        return {}

    attempts: list[bytes] = [content]
    encoding = str(headers.get("content-encoding", "")).lower()

    if "gzip" in encoding:
        try:
            attempts.append(gzip.decompress(content))
        except Exception:
            pass

    if "deflate" in encoding:
        try:
            attempts.append(zlib.decompress(content))
        except Exception:
            pass

    # Some upstream layers may return compressed bytes without content-encoding.
    try:
        attempts.append(gzip.decompress(content))
    except Exception:
        pass

    try:
        attempts.append(zlib.decompress(content, zlib.MAX_WBITS | 32))
    except Exception:
        pass

    for candidate in attempts:
        try:
            return json.loads(candidate.decode("utf-8"))
        except Exception:
            continue

    return None


def _get_set_cookie_headers(headers) -> list[str]:
    """Return all Set-Cookie headers from real httpx headers or simple test fakes."""
    if hasattr(headers, "get_list"):
        return headers.get_list("set-cookie")

    value = headers.get("set-cookie") if hasattr(headers, "get") else None
    if not value:
        return []

    if isinstance(value, list):
        return [str(item) for item in value]

    return [str(value)]


def _error_code_for_status(status_code: int) -> str:
    if status_code == 400:
        return "VALIDATION_ERROR"
    if status_code == 401:
        return "UNAUTHORIZED"
    if status_code == 404:
        return "NOT_FOUND"
    if status_code == 422:
        return "UNPROCESSABLE_ENTITY"
    if status_code >= 500:
        return "INTERNAL_ERROR"
    return "REQUEST_ERROR"


def _normalize_json_payload(payload, status_code: int):
    if isinstance(payload, dict) and "success" in payload:
        return payload

    if status_code < 400:
        if isinstance(payload, dict):
            return {"success": True, "data": payload, **payload}
        return {"success": True, "data": payload}

    message = "Request failed."
    details = None
    if isinstance(payload, dict):
        message = str(payload.get("message") or payload.get("msg") or payload.get("error") or message)
        details = payload.get("details")

    return {
        "success": False,
        "error": {
            "code": _error_code_for_status(status_code),
            "message": message,
            **({"details": details} if details is not None else {}),
        },
        "code": _error_code_for_status(status_code),
        "message": message,
    }


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


@app.get("/readyz")
async def readyz():
    return {"status": "ready"}


@app.get("/livez")
async def livez():
    return {"status": "live"}


@app.api_route(
    "/api/{full_path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    include_in_schema=False,
)
async def proxy_api(full_path: str, request: Request):
    """Forward all /api/* traffic to backend while preserving cookies and query params."""
    # Preflight must always return CORS headers (handled by CORSMiddleware),
    # and must not be blocked by auth logic.
    if str(request.method).upper() == "OPTIONS":
        # Let CORSMiddleware add the Access-Control-* headers.
        return Response(status_code=204)

    if not _is_public_api_route(full_path, request.method):
        verify_request_jwt(request)


    target_url = f"{settings.backend_url.rstrip('/')}/api/{full_path}"
    # For large multipart uploads, prefer streaming the request body to avoid
    # buffering the entire payload in memory at the gateway. For other content
    # types we still read the body into memory for simpler handling.
    content_type_hdr = str(request.headers.get("content-type") or "").lower()
    is_multipart = content_type_hdr.startswith("multipart/")
    body = None
    query_params = dict(request.query_params)

    correlation_id = getattr(request.state, "correlation_id", "")
    traceparent = getattr(request.state, "traceparent", "")

    outbound_headers = {
        key: value
        for key, value in request.headers.items()
        if key.lower() not in {"host", "content-length", "origin", "referer"}
    }
    outbound_headers.setdefault("x-correlation-id", correlation_id)
    outbound_headers.setdefault("x-request-id", correlation_id)
    outbound_headers.setdefault("traceparent", traceparent)
    # Ask backend for uncompressed payloads so the proxy always relays decodable JSON/text bodies.
    outbound_headers["accept-encoding"] = "identity"

    started_at = time.perf_counter()
    logger.info(f"Proxying {request.method} {request.url.path} -> {target_url} [ID: {correlation_id}]")

    try:
        timeout = httpx.Timeout(
            settings.request_timeout_seconds,
            connect=min(5.0, float(settings.request_timeout_seconds)),
            read=float(settings.request_timeout_seconds),
            write=float(settings.request_timeout_seconds),
            pool=float(settings.request_timeout_seconds),
        )
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            if is_multipart:
                # Stream multipart content directly from the incoming request
                backend_response = await client.request(
                    method=request.method,
                    url=target_url,
                    headers=outbound_headers,
                    params=query_params,
                    content=request.stream(),
                )
            else:
                # Small/non-multipart payloads are read into memory
                body = await request.body()
                backend_response = await client.request(
                    method=request.method,
                    url=target_url,
                    headers=outbound_headers,
                    params=query_params,
                    content=body if body else None,
                )
    except httpx.TimeoutException:
        logger.error(f"Upstream timeout for {target_url} [ID: {correlation_id}]")
        return JSONResponse(
            status_code=504,
            headers={"x-request-id": correlation_id, "x-correlation-id": correlation_id},
            content={
                "success": False,
                "error": {"code": "GATEWAY_TIMEOUT", "message": "The upstream service took too long to respond."},
                "code": "GATEWAY_TIMEOUT",
                "message": "The upstream service took too long to respond.",
            },
        )
    except Exception as e:
        logger.error(f"Proxy error for {target_url} [ID: {correlation_id}]: {str(e)}")
        return JSONResponse(
            status_code=502,
            headers={"x-request-id": correlation_id, "x-correlation-id": correlation_id},
            content={
                "success": False,
                "error": {"code": "BAD_GATEWAY", "message": "The upstream service is unavailable."},
                "code": "BAD_GATEWAY",
                "message": "The upstream service is unavailable.",
            },
        )

    duration_ms = (time.perf_counter() - started_at) * 1000
    logger.info(f"Upstream {target_url} returned {backend_response.status_code} in {duration_ms:.2f}ms")

    set_cookie_headers = _get_set_cookie_headers(backend_response.headers)
    content_type = backend_response.headers.get("content-type", "application/json")

    # Add all upstream headers to outbound response (except a few sensitive ones)
    ignored_headers = {"content-length", "content-encoding", "transfer-encoding", "connection", "keep-alive", "set-cookie"}
    outbound_response_headers = {
        key: value 
        for key, value in backend_response.headers.items() 
        if key.lower() not in ignored_headers
    }

    if "application/json" in content_type.lower():
        decoded_payload = _decode_json_payload(backend_response.content, backend_response.headers)
        if decoded_payload is not None:
            decoded_payload = _normalize_json_payload(decoded_payload, backend_response.status_code)

            response = JSONResponse(
                content=decoded_payload,
                status_code=backend_response.status_code,
                headers=outbound_response_headers
            )
            for cookie_header in set_cookie_headers:
                response.headers.append("set-cookie", cookie_header)
            return response

    response = Response(
        content=backend_response.content,
        status_code=backend_response.status_code,
        media_type=content_type,
        headers=outbound_response_headers
    )
    for cookie_header in set_cookie_headers:
        response.headers.append("set-cookie", cookie_header)
    return response


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
