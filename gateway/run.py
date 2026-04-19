"""Uvicorn startup script for development and production."""
import os
import sys
from pathlib import Path

# Add gateway directory to path
sys.path.insert(0, str(Path(__file__).parent))

import uvicorn

try:
    from gateway.utils.env import settings
except ImportError:
    from utils.env import settings

if __name__ == "__main__":
    # Ensure we're in the right directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Start uvicorn server
    uvicorn.run(
        "main:app",
        host=settings.gateway_host,
        port=settings.gateway_port,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    )
