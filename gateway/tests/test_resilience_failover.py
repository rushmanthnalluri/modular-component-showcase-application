import pytest
import httpx

from gateway.services.searchService import SearchService


class _FailingClient:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        return False

    async def request_json(self, *_args, **_kwargs):
        raise httpx.HTTPError("downstream failed")


@pytest.mark.asyncio
async def test_search_health_reports_down_on_failure(monkeypatch):
    monkeypatch.setattr("gateway.services.searchService.get_service_client", lambda *_args, **_kwargs: _FailingClient())
    result = await SearchService.check_health()
    assert result["status"] == "down"
