"""Authentication service for forwarding auth requests to backend."""
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


class AuthService:
    """Service for forwarding authentication requests."""

    @staticmethod
    async def signup(payload: Dict[str, Any]) -> Dict[str, Any]:
        """Forward signup request to backend.
        
        Args:
            payload: Signup data
            
        Returns:
            Response from backend
        """
        client = get_service_client(settings.auth_service_base_url)
        try:
            async with client as http_client:
                return await http_client.request_json("POST", "/api/auth/register", json=payload)
        except httpx.HTTPError as e:
            logger.error(f"Signup failed: {e}")
            raise

    @staticmethod
    async def signin(payload: Dict[str, Any]) -> Dict[str, Any]:
        """Forward signin request to backend."""
        client = get_service_client(settings.auth_service_base_url)
        try:
            async with client as http_client:
                return await http_client.request_json("POST", "/api/auth/login", json=payload)
        except httpx.HTTPError as e:
            logger.error(f"Signin failed: {e}")
            raise

    @staticmethod
    async def logout() -> Dict[str, Any]:
        """Forward logout request to backend."""
        client = get_service_client(settings.auth_service_base_url)
        try:
            async with client as http_client:
            return await http_client.request_json("POST", "/api/auth/logout")
        except httpx.HTTPError as e:
            logger.error(f"Logout failed: {e}")
            raise

    @staticmethod
    async def get_csrf() -> Dict[str, Any]:
        """Forward CSRF request to backend."""
        client = get_service_client(settings.auth_service_base_url)
        try:
            async with client as http_client:
            return await http_client.request_json("GET", "/api/auth/csrf")
        except httpx.HTTPError as e:
            logger.error(f"CSRF fetch failed: {e}")
            raise
