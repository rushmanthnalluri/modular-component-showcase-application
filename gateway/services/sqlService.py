"""SQL service for forwarding SQL catalog requests to backend."""
import logging
from typing import Dict, Any, Optional
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


class SQLService:
    """Service for forwarding SQL requests."""

    @staticmethod
    async def list_components(
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 25,
    ) -> Dict[str, Any]:
        """Fetch components from SQL catalog.
        
        Args:
            search: Search query
            page: Page number
            limit: Results per page
            
        Returns:
            Components list with pagination
        """
        client = get_service_client(settings.sql_service_base_url)
        try:
            async with client as http_client:
                params = {"page": page, "limit": limit}
                if search:
                    params["search"] = search
                return await http_client.request_json("GET", "/api/sql/components", params=params)
        except httpx.HTTPError as e:
            logger.error(f"List components failed: {e}")
            raise

    @staticmethod
    async def list_users() -> Dict[str, Any]:
        client = get_service_client(settings.sql_service_base_url)
        try:
            async with client as http_client:
                return await http_client.request_json("GET", "/api/sql/users")
        except httpx.HTTPError as e:
            logger.error(f"List users failed: {e}")
            raise

    @staticmethod
    async def list_categories() -> Dict[str, Any]:
        client = get_service_client(settings.sql_service_base_url)
        try:
            async with client as http_client:
                return await http_client.request_json("GET", "/api/sql/categories")
        except httpx.HTTPError as e:
            logger.error(f"List categories failed: {e}")
            raise

    @staticmethod
    async def create_component(payload: Dict[str, Any]) -> Dict[str, Any]:
        """Create new component in SQL catalog."""
        client = get_service_client(settings.sql_service_base_url)
        try:
            async with client as http_client:
                return await http_client.request_json("POST", "/api/sql/components", json=payload)
        except httpx.HTTPError as e:
            logger.error(f"Create component failed: {e}")
            raise

    @staticmethod
    async def update_component(component_id: int, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Update component in SQL catalog."""
        client = get_service_client(settings.sql_service_base_url)
        try:
            async with client as http_client:
                return await http_client.request_json(
                    "PUT",
                    f"/api/sql/components/{component_id}",
                    json=payload,
                )
        except httpx.HTTPError as e:
            logger.error(f"Update component failed: {e}")
            raise

    @staticmethod
    async def delete_component(component_id: int) -> Dict[str, Any]:
        """Delete component from SQL catalog."""
        client = get_service_client(settings.sql_service_base_url)
        try:
            async with client as http_client:
                return await http_client.request_json("DELETE", f"/api/sql/components/{component_id}")
        except httpx.HTTPError as e:
            logger.error(f"Delete component failed: {e}")
            raise
