"""Tests for gateway env parsing and import compatibility."""

import importlib
import sys
from pathlib import Path

import pytest

# Add parent directory to path for relative imports
sys.path.insert(0, str(Path(__file__).parent.parent))


def _reload_env_module(monkeypatch, **values):
    for key in [
        "BACKEND_URL",
        "AUTH_SERVICE_URL",
        "SEARCH_SERVICE_URL",
        "SQL_SERVICE_URL",
        "COMPONENT_SERVICE_URL",
        "SPRING_SERVICE_URL",
        "FRONTEND_URL",
        "GATEWAY_PORT",
        "GATEWAY_HOST",
        "LOG_LEVEL",
        "DEBUG",
    ]:
        monkeypatch.delenv(key, raising=False)

    for key, value in values.items():
        monkeypatch.setenv(key, value)

    module = importlib.import_module("gateway.utils.env")
    return importlib.reload(module)


def test_service_url_fallbacks_to_backend(monkeypatch):
    env_module = _reload_env_module(monkeypatch, BACKEND_URL="http://example-backend:5000")
    settings = env_module.settings

    assert settings.backend_url == "http://example-backend:5000"
    assert settings.auth_service_base_url == "http://example-backend:5000"
    assert settings.search_service_base_url == "http://example-backend:5000"
    assert settings.sql_service_base_url == "http://example-backend:5000"
    assert settings.component_service_base_url == "http://example-backend:5000"
    assert settings.spring_service_base_url == "http://example-backend:5000"


def test_service_url_overrides_are_respected(monkeypatch):
    env_module = _reload_env_module(
        monkeypatch,
        BACKEND_URL="http://example-backend:5000",
        AUTH_SERVICE_URL="http://auth-service:5001",
        SEARCH_SERVICE_URL="http://search-service:5002",
        SQL_SERVICE_URL="http://sql-service:5003",
        COMPONENT_SERVICE_URL="http://component-service:5004",
        SPRING_SERVICE_URL="http://springboot:8081",
    )
    settings = env_module.settings

    assert settings.auth_service_base_url == "http://auth-service:5001"
    assert settings.search_service_base_url == "http://search-service:5002"
    assert settings.sql_service_base_url == "http://sql-service:5003"
    assert settings.component_service_base_url == "http://component-service:5004"
    assert settings.spring_service_base_url == "http://springboot:8081"


def test_gateway_entrypoints_expose_same_app():
    from gateway.main import app as root_app
    from gateway.app.main import app as compat_app

    assert root_app is compat_app
