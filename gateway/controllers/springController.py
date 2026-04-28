"""Spring controller for forwarding Spring service requests."""
from fastapi import APIRouter, Depends, HTTPException, status
import sys
from pathlib import Path

# Add parent directory to path for relative imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from gateway.services.springService import SpringService
    from gateway.dependencies.security import get_current_principal
except ImportError:
    from services.springService import SpringService
    from dependencies.security import get_current_principal

router = APIRouter(prefix="/springservice", tags=["spring"])


@router.get("/users")
async def spring_users(_principal=Depends(get_current_principal)):
    try:
        return await SpringService.get_users()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Spring users fetch failed.",
        )


@router.get("/components")
async def spring_components(_principal=Depends(get_current_principal)):
    try:
        return await SpringService.get_components()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Spring components fetch failed.",
        )


@router.get("/reviews")
async def spring_reviews(_principal=Depends(get_current_principal)):
    try:
        return await SpringService.get_reviews()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Spring reviews fetch failed.",
        )


@router.get("/health")
async def spring_health():
    try:
        return await SpringService.check_health()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Spring health check failed.",
        )
