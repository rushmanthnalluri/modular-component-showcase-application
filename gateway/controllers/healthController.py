"""Health controller for health checks and metrics."""
from datetime import datetime, timezone
import logging
from time import perf_counter
from pathlib import Path
import sys

from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import PlainTextResponse

# Add parent directory to path for relative imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from gateway.services.httpClient import get_service_client
    from gateway.services.searchService import SearchService
    from gateway.models.schemas import HealthCheckSchema
    from gateway.utils.env import settings
except ImportError:
    from services.httpClient import get_service_client
    from services.searchService import SearchService
    from models.schemas import HealthCheckSchema
    from utils.env import settings

router = APIRouter(tags=["health"])
logger = logging.getLogger(__name__)
DEPENDENCY_UNAVAILABLE_MESSAGE = "Dependency unavailable"
HEALTH_CHECK_FAILED_MESSAGE = "Health check failed"
UNEXPECTED_INTERNAL_ERROR_MESSAGE = "Unexpected internal error"
METRICS_STATE = {
    "started_at": perf_counter(),
    "requests_total": 0,
    "errors_total": 0,
    "response_time_total_ms": 0.0,
}
LAST_DOWNSTREAM_AVAILABILITY = {
    "backend": "unknown",
    "auth_service": "unknown",
    "search_service": "unknown",
    "sql_service": "unknown",
    "component_service": "unknown",
    "spring_service": "unknown",
}


def record_request_metric(duration_ms: float, status_code: int) -> None:
    METRICS_STATE["requests_total"] += 1
    METRICS_STATE["response_time_total_ms"] += max(0.0, float(duration_ms))
    if status_code >= 500:
        METRICS_STATE["errors_total"] += 1


def snapshot_metrics(include_current_request: bool = False) -> dict:
    total_requests = METRICS_STATE["requests_total"] + (1 if include_current_request else 0)
    avg_response_time_ms = (
        METRICS_STATE["response_time_total_ms"] / total_requests if total_requests else 0.0
    )
    uptime_seconds = max(0.0, perf_counter() - METRICS_STATE["started_at"])
    return {
        "uptime_seconds": round(uptime_seconds, 3),
        "request_count": total_requests,
        "requests_total": total_requests,
        "error_count": METRICS_STATE["errors_total"],
        "avg_response_time_ms": round(avg_response_time_ms, 3),
    }


def reset_metrics() -> None:
    METRICS_STATE["started_at"] = perf_counter()
    METRICS_STATE["requests_total"] = 0
    METRICS_STATE["errors_total"] = 0
    METRICS_STATE["response_time_total_ms"] = 0.0


async def _check_service(name: str, base_url: str, path: str = "/health") -> dict:
    started_at = perf_counter()
    try:
        client = get_service_client(base_url)
        async with client as http_client:
            await http_client.get(path)
            response_time_ms = max(0.0, (perf_counter() - started_at) * 1000)
            return {
                "service": name,
                "status": "up",
                "response_time_ms": round(response_time_ms, 3),
                "error_message": None,
            }
    except Exception as exc:
        response_time_ms = max(0.0, (perf_counter() - started_at) * 1000)
        logger.exception(
            "Downstream health check failed",
            extra={"service": name, "base_url": base_url, "path": path},
        )
        return {
            "service": name,
            "status": "down",
            "response_time_ms": round(response_time_ms, 3),
            "error_message": DEPENDENCY_UNAVAILABLE_MESSAGE,
        }


@router.get("/health", response_model=HealthCheckSchema)
async def health_check():
    """Aggregate health status of all services.
    
    Returns:
        Health status of gateway and all services
    """
    try:
        backend_health = await _check_service("backend", settings.backend_url)
        auth_health = await _check_service("auth", settings.auth_service_base_url)
        search_health = await _check_service("search", settings.search_service_base_url)
        sql_health = await _check_service("sql", settings.sql_service_base_url)
        component_health = await _check_service("component", settings.component_service_base_url)
        spring_health = await _check_service("spring", settings.spring_service_base_url, "/spring/health")

        backend_status = backend_health["status"]
        service_statuses = [backend_health, auth_health, search_health, sql_health, component_health, spring_health]
        unhealthy_count = sum(1 for service in service_statuses if service["status"] != "up")

        if unhealthy_count == 0:
            overall_status = "healthy"
        elif backend_status == "up":
            overall_status = "degraded"
        else:
            overall_status = "unhealthy"

        backend_client = get_service_client(settings.backend_url)
        backend_payload = {}
        try:
            async with backend_client as http_client:
                backend_payload = await http_client.request_json("GET", "/health")
        except Exception:
            logger.warning(
                "Backend health payload unavailable",
                extra={"service": "backend", "path": "/health"},
                exc_info=True,
            )
            backend_payload = {}

        mongo_status = "up" if bool(backend_payload.get("mongo")) else "down"
        postgres_status = "up" if bool(backend_payload.get("postgres")) else "down"

        LAST_DOWNSTREAM_AVAILABILITY.update({
            "backend": backend_status,
            "auth_service": auth_health["status"],
            "search_service": search_health["status"],
            "sql_service": sql_health["status"],
            "component_service": component_health["status"],
            "spring_service": spring_health["status"],
        })

        return {
            "status": overall_status,
            "gateway": "up",
            "backend": backend_status,
            "auth_service": auth_health["status"],
            "search_service": search_health["status"],
            "sql_service": sql_health["status"],
            "component_service": component_health["status"],
            "spring_service": spring_health["status"],
            "mongo": mongo_status,
            "postgres": postgres_status,
            "services": service_statuses,
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        }
    except Exception:
        logger.exception("Gateway health check failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=HEALTH_CHECK_FAILED_MESSAGE,
        )


def _render_prometheus_metrics(metrics_snapshot: dict) -> str:
    lines = [
        "# HELP gateway_requests_total Total HTTP requests observed by the gateway.",
        "# TYPE gateway_requests_total counter",
        f"gateway_requests_total {metrics_snapshot['requests_total']}",
        "# HELP gateway_errors_total Total HTTP 5xx responses observed by the gateway.",
        "# TYPE gateway_errors_total counter",
        f"gateway_errors_total {metrics_snapshot['error_count']}",
        "# HELP gateway_avg_response_time_ms Average gateway response time in milliseconds.",
        "# TYPE gateway_avg_response_time_ms gauge",
        f"gateway_avg_response_time_ms {metrics_snapshot['avg_response_time_ms']}",
        "# HELP gateway_uptime_seconds Gateway uptime in seconds.",
        "# TYPE gateway_uptime_seconds gauge",
        f"gateway_uptime_seconds {metrics_snapshot['uptime_seconds']}",
    ]
    return "\n".join(lines) + "\n"


@router.get("/metrics")
async def metrics(request: Request):
    """Return basic metrics.
    
    Returns:
        Metrics data
    """
    try:
        metrics_snapshot = snapshot_metrics(include_current_request=True)
        format_hint = request.query_params.get("format", "").strip().lower()
        accept_header = request.headers.get("accept", "").lower()
        if format_hint == "prometheus" or "text/plain" in accept_header:
            return PlainTextResponse(_render_prometheus_metrics(metrics_snapshot), media_type="text/plain; version=0.0.4")
        return {
            **metrics_snapshot,
            "downstream_service_availability": dict(LAST_DOWNSTREAM_AVAILABILITY),
        }
    except Exception:
        logger.exception("Gateway metrics fetch failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=UNEXPECTED_INTERNAL_ERROR_MESSAGE,
        )
