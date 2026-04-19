"""FastAPI application initialization and configuration."""
import logging
import sys
import os
import time
from pathlib import Path

# Add gateway directory to path for imports to work in container
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    # Import from package structure (when run as `uvicorn gateway.main:app`)
    from gateway.utils.env import settings
    from gateway.controllers import (
        authenticationController,
        searchController,
        healthController,
        sqlController,
        componentController,
    )
    from gateway.controllers.healthController import record_request_metric
except ImportError:
    # Import with relative paths (when run in container)
    from utils.env import settings
    from controllers import (
        authenticationController,
        searchController,
        healthController,
        sqlController,
        componentController,
    )
    from controllers.healthController import record_request_metric

# Configure logging
logging.basicConfig(level=settings.log_level.upper())
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Modular Component Showcase Gateway",
    description="API Gateway for component showcase backend services",
    version="1.0.0",
    debug=settings.debug,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def collect_request_metrics(request, call_next):
    started_at = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - started_at) * 1000
    record_request_metric(duration_ms, response.status_code)
    return response

# Register routers
app.include_router(authenticationController.router)
app.include_router(searchController.router)
app.include_router(healthController.router)
app.include_router(sqlController.router)
app.include_router(componentController.router)


@app.get("/")
async def root():
    """Gateway root endpoint.
    
    Returns:
        Gateway info
    """
    return {
        "message": "Modular Component Showcase Gateway",
        "version": "1.0.0",
        "status": "running",
        "backend_url": settings.backend_url,
        "frontend_url": settings.frontend_url,
    }


@app.get("/status")
async def status():
    """Gateway status endpoint.
    
    Returns:
        Gateway status
    """
    return {
        "status": "operational",
        "gateway_host": settings.gateway_host,
        "gateway_port": settings.gateway_port,
        "debug": settings.debug,
    }


if __name__ == "__main__":
    import uvicorn
    
    logger.info(f"Starting gateway on {settings.gateway_host}:{settings.gateway_port}")
    logger.info(f"Backend URL: {settings.backend_url}")
    logger.info(f"CORS Origins: {settings.cors_origins}")
    
    uvicorn.run(
        "gateway.main:app",
        host=settings.gateway_host,
        port=settings.gateway_port,
        reload=settings.debug,
    )
