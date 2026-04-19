"""HTTP client for forwarding requests to backend services."""
import logging
import time
from pathlib import Path
from typing import Any, Dict, Optional

import httpx

# Add parent directory to path for relative imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from gateway.utils.env import settings
except ImportError:
    from utils.env import settings

logger = logging.getLogger(__name__)


def build_standard_error(method: str, path: str, message: str, status_code: int | None = None, details: Any = None) -> dict[str, Any]:
    return {
        "method": method,
        "path": path,
        "message": message,
        "status_code": status_code,
        "details": details,
    }


class GatewayHTTPClient:
    """Reusable async HTTP client with error handling and retries."""

    def __init__(
        self,
        base_url: str,
        timeout: int = 30,
        max_retries: int = 2,
    ):
        """Initialize HTTP client.
        
        Args:
            base_url: Base URL for backend service
            timeout: Request timeout in seconds
            max_retries: Number of retries on failure
        """
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries
        self.client = None
        self.last_duration_ms = 0.0

    async def __aenter__(self):
        """Async context manager entry."""
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=self.timeout,
            follow_redirects=True,
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.client:
            await self.client.aclose()

    def _log_error(self, method: str, path: str, error: Exception) -> None:
        payload = build_standard_error(method, path, str(error))
        logger.error("%s %s failed: %s", payload["method"], payload["path"], payload["message"])

    async def request(
        self,
        method: str,
        path: str,
        headers: Optional[Dict[str, str]] = None,
        params: Optional[Dict[str, Any]] = None,
        json: Optional[Dict[str, Any]] = None,
        data: Optional[Any] = None,
    ) -> httpx.Response:
        """Perform a request with retry logic and timing."""
        if not self.client:
            raise RuntimeError("Client not initialized. Use async context manager.")

        attempt = 0
        while attempt < self.max_retries:
            try:
                started_at = time.perf_counter()
                response = await self.client.request(
                    method,
                    path,
                    headers=headers or {},
                    params=params,
                    json=json,
                    data=data,
                )
                self.last_duration_ms = (time.perf_counter() - started_at) * 1000
                response.raise_for_status()
                return response
            except (httpx.TimeoutException, httpx.HTTPError) as e:
                attempt += 1
                if attempt >= self.max_retries:
                    self._log_error(method, path, e)
                    raise
                logger.warning("%s %s attempt %s failed, retrying...", method, path, attempt)

    async def request_json(
        self,
        method: str,
        path: str,
        headers: Optional[Dict[str, str]] = None,
        params: Optional[Dict[str, Any]] = None,
        json: Optional[Dict[str, Any]] = None,
        data: Optional[Any] = None,
    ) -> Dict[str, Any]:
        response = await self.request(
            method,
            path,
            headers=headers,
            params=params,
            json=json,
            data=data,
        )
        if response.status_code == 204:
            return {}
        return response.json()

    async def get(
        self,
        path: str,
        headers: Optional[Dict[str, str]] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> httpx.Response:
        return await self.request("GET", path, headers=headers, params=params)

    async def post(
        self,
        path: str,
        json: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        data: Optional[Any] = None,
    ) -> httpx.Response:
        """Perform POST request with retry logic.
        
        Args:
            path: Request path
            json: JSON body
            headers: Optional request headers
            data: Optional form data
            
        Returns:
            Response object
            
        Raises:
            httpx.HTTPError: If request fails after retries
        """
        return await self.request("POST", path, headers=headers, json=json, data=data)

    async def put(
        self,
        path: str,
        json: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> httpx.Response:
        """Perform PUT request with retry logic."""
        return await self.request("PUT", path, headers=headers, json=json)

    async def delete(
        self,
        path: str,
        headers: Optional[Dict[str, str]] = None,
    ) -> httpx.Response:
        """Perform DELETE request with retry logic."""
        return await self.request("DELETE", path, headers=headers)


def get_service_client(base_url: Optional[str] = None):
    """Factory function for a gateway downstream HTTP client."""
    return GatewayHTTPClient(
        base_url=base_url or settings.backend_url,
        timeout=30,
        max_retries=2,
    )


def get_backend_client():
    """Factory function for backend HTTP client."""
    return get_service_client(settings.backend_url)
