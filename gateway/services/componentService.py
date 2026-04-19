"""Component service for forwarding component requests to backend."""
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


class ComponentService:
    """Service for forwarding component requests."""

    @staticmethod
    async def list_components(category: Optional[str] = None) -> Dict[str, Any]:
        """Fetch components from backend.
        
        Args:
            category: Optional category filter
            
        Returns:
            Components list
        """
        client = get_service_client(settings.component_service_base_url)
        try:
            async with client as http_client:
                params = {}
                if category:
                    params["category"] = category
                return await http_client.request_json("GET", "/api/components", params=params)
        except httpx.HTTPError as e:
            logger.error(f"List components failed: {e}")
            raise

    @staticmethod
    async def get_component(component_id: str) -> Dict[str, Any]:
        """Fetch single component from backend."""
        client = get_service_client(settings.component_service_base_url)
        try:
            async with client as http_client:
                return await http_client.request_json("GET", f"/api/components/{component_id}")
        except httpx.HTTPError as e:
            logger.error(f"Get component failed: {e}")
            raise

    @staticmethod
    async def create_component(payload: Dict[str, Any]) -> Dict[str, Any]:
        """Create new component."""
        client = get_service_client(settings.component_service_base_url)
        try:
            async with client as http_client:
                return await http_client.request_json("POST", "/api/components", json=payload)
        except httpx.HTTPError as e:
            logger.error(f"Create component failed: {e}")
            raise

    @staticmethod
    async def update_component(component_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Update component."""
        client = get_service_client(settings.component_service_base_url)
        try:
            async with client as http_client:
                return await http_client.request_json(
                    "PUT",
                    f"/api/components/{component_id}",
                    json=payload,
                )
        except httpx.HTTPError as e:
            logger.error(f"Update component failed: {e}")
            raise

    @staticmethod
    async def delete_component(component_id: str) -> Dict[str, Any]:
        """Delete component."""
        client = get_service_client(settings.component_service_base_url)
        try:
            async with client as http_client:
                return await http_client.request_json("DELETE", f"/api/components/{component_id}")
        except httpx.HTTPError as e:
            logger.error(f"Delete component failed: {e}")
            raise
