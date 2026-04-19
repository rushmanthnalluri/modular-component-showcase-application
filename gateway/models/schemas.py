"""Pydantic schemas for request/response validation."""
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


class SignupSchema(BaseModel):
    """User signup request schema."""

    fullName: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=20)
    password: str = Field(..., min_length=8)
    confirmPassword: str = Field(..., min_length=8)

    class Config:
        json_schema_extra = {
            "example": {
                "fullName": "John Doe",
                "email": "john@example.com",
                "phone": "1234567890",
                "password": "password123",
                "confirmPassword": "password123",
            }
        }


class SigninSchema(BaseModel):
    """User signin request schema."""

    email: EmailStr
    password: str = Field(..., min_length=1)
    captcha: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "email": "john@example.com",
                "password": "password123",
                "captcha": "ABC123",
            }
        }


class SearchSchema(BaseModel):
    """Search request schema."""

    query: str = Field(..., min_length=1, max_length=500)
    limit: int = Field(default=10, ge=1, le=100)
    offset: int = Field(default=0, ge=0)

    class Config:
        json_schema_extra = {
            "example": {
                "query": "button component",
                "limit": 10,
                "offset": 0,
            }
        }


class ComponentSchema(BaseModel):
    """Component schema for response."""

    id: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    framework: Optional[str] = None
    tags: Optional[List[str]] = []
    previewUrl: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "id": "button-primary",
                "name": "Primary Button",
                "description": "Call-to-action button",
                "category": "buttons",
                "framework": "react",
                "tags": ["interactive", "cta"],
                "previewUrl": "https://example.com/preview",
            }
        }


class SQLComponentSchema(BaseModel):
    """SQL component schema."""

    id: int
    name: str
    description: str
    category_id: int
    user_id: int
    category_name: Optional[str] = None
    user_name: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "id": 1,
                "name": "Input Component",
                "description": "Form input element",
                "category_id": 2,
                "user_id": 1,
                "category_name": "Forms",
                "user_name": "Admin",
                "created_at": "2024-01-15T10:30:00Z",
            }
        }


class ServiceHealthSchema(BaseModel):
    """Structured downstream service health information."""

    service: str
    status: str = Field(..., pattern="^(up|down|unknown)$")
    response_time_ms: float
    error_message: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "service": "backend",
                "status": "up",
                "response_time_ms": 12.34,
                "error_message": None,
            }
        }


class HealthCheckSchema(BaseModel):
    """Health check response schema."""

    status: str = Field(..., pattern="^(healthy|degraded|unhealthy)$")
    gateway: str = Field(..., pattern="^(up|down)$")
    backend: str = Field(..., pattern="^(up|down)$")
    auth_service: str = Field(..., pattern="^(up|down)$")
    search_service: str = Field(..., pattern="^(up|down)$")
    sql_service: str = Field(..., pattern="^(up|down)$")
    component_service: str = Field(..., pattern="^(up|down)$")
    mongo: str = Field(..., pattern="^(up|down)$")
    postgres: str = Field(..., pattern="^(up|down)$")
    services: List[ServiceHealthSchema]
    timestamp: str

    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "gateway": "up",
                "backend": "up",
                "auth_service": "up",
                "search_service": "up",
                "sql_service": "up",
                "component_service": "up",
                "mongo": "up",
                "postgres": "up",
                "services": [
                    {
                        "service": "backend",
                        "status": "up",
                        "response_time_ms": 12.34,
                        "error_message": None,
                    }
                ],
                "timestamp": "2024-01-15T10:30:00Z",
            }
        }


class MetricsSchema(BaseModel):
    """Metrics response schema."""

    requests_total: int
    requests_success: int
    requests_error: int
    avg_response_time_ms: float

    class Config:
        json_schema_extra = {
            "example": {
                "requests_total": 1000,
                "requests_success": 950,
                "requests_error": 50,
                "avg_response_time_ms": 45.2,
            }
        }
