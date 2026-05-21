"""Spring service proxy helpers."""
import logging
from typing import Dict, Any
import sys
from pathlib import Path
import httpx

# Add parent directory to path for relative imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from gateway.services.httpClient import get_service_client
    from gateway.utils.env import settings
except ImportError:
    from services.httpClient import get_service_client
    from utils.env import settings

logger = logging.getLogger(__name__)


class SpringService:
    """Service for forwarding requests to Spring service."""

    @staticmethod
    async def get_users(headers: Dict[str, str] | None = None) -> Dict[str, Any]:
        client = get_service_client(settings.spring_service_base_url)
        try:
            async with client as http_client:
                return await http_client.request_json("GET", "/spring/users", headers=headers)
        except httpx.HTTPError as e:
            logger.error(f"Spring users fetch failed: {e}")
            raise

    @staticmethod
    async def get_components(headers: Dict[str, str] | None = None) -> Dict[str, Any]:
        client = get_service_client(settings.spring_service_base_url)
        try:
            async with client as http_client:
                return await http_client.request_json("GET", "/spring/components", headers=headers)
        except httpx.HTTPError as e:
            logger.error(f"Spring components fetch failed: {e}")
            raise

    @staticmethod
    async def get_reviews(headers: Dict[str, str] | None = None) -> Dict[str, Any]:
        client = get_service_client(settings.spring_service_base_url)
        try:
            async with client as http_client:
                return await http_client.request_json("GET", "/spring/reviews", headers=headers)
        except httpx.HTTPError as e:
            logger.error(f"Spring reviews fetch failed: {e}")
            raise

    @staticmethod
    async def check_health(headers: Dict[str, str] | None = None) -> Dict[str, str]:
        client = get_service_client(settings.spring_service_base_url)
        try:
            async with client as http_client:
                await http_client.request_json("GET", "/spring/health", headers=headers)
                return {"status": "up", "spring_service": "up"}
        except httpx.HTTPError as e:
            return {"status": "down", "spring_service": "down", "error": f"{type(e).__name__}: {str(e)}"}
