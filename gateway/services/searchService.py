"""Search service for forwarding search requests to backend."""
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


class SearchService:
    """Service for forwarding search requests."""

    @staticmethod
    async def search(query: str, limit: int = 10) -> Dict[str, Any]:
        """Forward search request to backend.
        
        Args:
            query: Search query string
            limit: Result limit
            
        Returns:
            Search results from backend
        """
        client = get_service_client(settings.search_service_base_url)
        try:
            async with client as http_client:
                return await http_client.request_json(
                    "POST",
                    "/api/search",
                    json={"query": query, "limit": limit},
                )
        except httpx.HTTPError as e:
            logger.error(f"Search failed: {e}")
            raise

    @staticmethod
    async def get_search_history() -> Dict[str, Any]:
        """Fetch search history from backend."""
        client = get_service_client(settings.search_service_base_url)
        try:
            async with client as http_client:
            return await http_client.request_json("GET", "/api/logs")
        except httpx.HTTPError as e:
            logger.error(f"Get search history failed: {e}")
            raise

    @staticmethod
    async def check_health() -> Dict[str, str]:
        """Check search service health."""
        client = get_service_client(settings.search_service_base_url)
        try:
            async with client as http_client:
            data = await http_client.request_json("GET", "/health")
                return {"status": "up", "backend": data.get("status", "up")}
        except httpx.HTTPError:
            return {"status": "down", "backend": "down"}
