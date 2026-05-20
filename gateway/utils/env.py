"""Environment variable configuration with a pydantic-settings fallback."""

from __future__ import annotations

import os

try:
    from pydantic_settings import BaseSettings
except ImportError:  # pragma: no cover - fallback for stripped local environments
    class BaseSettings:
        """Minimal settings fallback when pydantic-settings is unavailable."""

        def __init__(self, **values):
            for key, value in values.items():
                setattr(self, key, value)


class Settings(BaseSettings):
    """Load environment variables with type safety and defaults."""

    backend_url: str = "http://localhost:5000"
    auth_service_url: str | None = None
    search_service_url: str | None = None
    sql_service_url: str | None = None
    component_service_url: str | None = None
    spring_service_url: str | None = None
    frontend_url: str = "http://localhost:8080"
    gateway_port: int = 8000
    gateway_host: str = "0.0.0.0"
    log_level: str = "info"
    debug: bool = False
    request_timeout_seconds: int = 20
    request_max_retries: int = 2

    def __init__(self, **values):
        defaults = {
            "backend_url": os.getenv("BACKEND_URL", "http://localhost:5000"),
            "auth_service_url": os.getenv("AUTH_SERVICE_URL"),
            "search_service_url": os.getenv("SEARCH_SERVICE_URL"),
            "sql_service_url": os.getenv("SQL_SERVICE_URL"),
            "component_service_url": os.getenv("COMPONENT_SERVICE_URL"),
            "spring_service_url": os.getenv("SPRING_SERVICE_URL"),
            "frontend_url": os.getenv("FRONTEND_URL", "http://localhost:8080"),
            "gateway_port": int(os.getenv("GATEWAY_PORT", "8000")),
            "gateway_host": os.getenv("GATEWAY_HOST", "0.0.0.0"),
            "log_level": os.getenv("LOG_LEVEL", "info"),
            "debug": os.getenv("DEBUG", "false").lower() == "true",
            "request_timeout_seconds": int(os.getenv("REQUEST_TIMEOUT_SECONDS", "20")),
            "request_max_retries": int(os.getenv("REQUEST_MAX_RETRIES", "2")),
        }
        defaults.update(values)
        super().__init__(**defaults)

    @property
    def cors_origins(self) -> list[str]:
        """Return allowed CORS origins.

        Production must explicitly allow the GitHub Pages origin and the Render frontend origin.
        Avoid wildcard origins because credentials/JWT cookies are used.
        """
        github_pages_frontend = "https://rushmanthnalluri.github.io"
        render_frontend = "https://modular-component-showcase-frontend.onrender.com"
        render_app_url = "https://modular-component-showcase-application-ve5e.onrender.com"

        # FRONTEND_URL is still respected for flexibility across environments.
        return [
            github_pages_frontend,
            render_frontend,
            render_app_url,
            self.frontend_url,
            "http://localhost:5173",
            "http://localhost:8080",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:8080",
        ]


    @property
    def auth_service_base_url(self) -> str:
        return self.auth_service_url or self.backend_url

    @property
    def search_service_base_url(self) -> str:
        return self.search_service_url or self.backend_url

    @property
    def sql_service_base_url(self) -> str:
        return self.sql_service_url or self.backend_url

    @property
    def component_service_base_url(self) -> str:
        return self.component_service_url or self.backend_url

    @property
    def spring_service_base_url(self) -> str:
        return self.spring_service_url or self.backend_url


# Global settings instance
settings = Settings()


def validate_runtime_environment() -> None:
    """Fail fast on missing production secrets while keeping local development ergonomic."""
    environment = os.getenv("ENVIRONMENT", os.getenv("NODE_ENV", "development")).lower()
    if environment not in {"production", "prod"}:
        return

    secret = os.getenv("JWT_SECRET") or os.getenv("SPRING_JWT_SECRET") or ""
    if len(secret.encode("utf-8")) < 32:
        raise RuntimeError("JWT_SECRET or SPRING_JWT_SECRET must be at least 32 UTF-8 bytes in production.")
