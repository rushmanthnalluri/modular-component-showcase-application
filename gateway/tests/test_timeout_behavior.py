import httpx
import pytest

from gateway.services.httpClient import GatewayHTTPClient


class _AlwaysTimeoutClient:
    async def request(self, *_args, **_kwargs):
        raise httpx.TimeoutException("timeout")


@pytest.mark.asyncio
async def test_gateway_client_timeout_retries_then_raises():
    client = GatewayHTTPClient(base_url="http://localhost", timeout=1, max_retries=2)
    async with client:
        client.client = _AlwaysTimeoutClient()
        with pytest.raises(httpx.TimeoutException):
            await client.request("GET", "/health")
