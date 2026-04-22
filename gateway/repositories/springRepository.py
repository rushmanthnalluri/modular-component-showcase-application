"""Repository for Spring service proxied access."""

from __future__ import annotations

from gateway.services.httpClient import get_service_client
from gateway.utils.env import settings


class SpringRepository:
    @staticmethod
    async def get_health() -> dict:
        client = get_service_client(settings.spring_service_base_url)
        async with client as http_client:
            return await http_client.request_json("GET", "/spring/health")
