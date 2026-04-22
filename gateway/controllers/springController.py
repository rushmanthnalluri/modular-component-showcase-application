"""Spring controller for forwarding Spring service requests."""
from fastapi import APIRouter, HTTPException, status
import sys
from pathlib import Path

# Add parent directory to path for relative imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from gateway.services.springService import SpringService
except ImportError:
    from services.springService import SpringService

router = APIRouter(prefix="/springservice", tags=["spring"])


@router.get("/users")
async def spring_users():
    try:
        return await SpringService.get_users()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Spring users fetch failed: {str(e)}",
        )


@router.get("/components")
async def spring_components():
    try:
        return await SpringService.get_components()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Spring components fetch failed: {str(e)}",
        )


@router.get("/reviews")
async def spring_reviews():
    try:
        return await SpringService.get_reviews()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Spring reviews fetch failed: {str(e)}",
        )


@router.get("/health")
async def spring_health():
    try:
        return await SpringService.check_health()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Spring health check failed: {str(e)}",
        )
