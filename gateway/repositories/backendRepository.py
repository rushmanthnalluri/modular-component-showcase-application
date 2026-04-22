"""Repository for backend proxied access."""

from __future__ import annotations

from gateway.services.httpClient import get_service_client
from gateway.utils.env import settings


class BackendRepository:
    @staticmethod
    async def get_health() -> dict:
        client = get_service_client(settings.backend_url)
        async with client as http_client:
            return await http_client.request_json("GET", "/health")
