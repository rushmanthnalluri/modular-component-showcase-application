"""Environment variable configuration using pydantic-settings."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Load environment variables with type safety and defaults."""

    backend_url: str = "http://localhost:5000"
    auth_service_url: str | None = None
    search_service_url: str | None = None
    sql_service_url: str | None = None
    component_service_url: str | None = None
    frontend_url: str = "http://localhost:8080"
    gateway_port: int = 8000
    gateway_host: str = "0.0.0.0"
    log_level: str = "info"
    debug: bool = False

    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def cors_origins(self) -> list[str]:
        """Return allowed CORS origins."""
        return [
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


# Global settings instance
settings = Settings()
