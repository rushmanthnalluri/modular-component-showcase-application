"""Spring controller for forwarding Spring service requests."""
from fastapi import APIRouter, Depends, HTTPException, Request, status
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
async def spring_users(request: Request, _principal=Depends(get_current_principal)):
    try:
        headers = {"Authorization": request.headers.get("authorization")} if request.headers.get("authorization") else None
        return await SpringService.get_users(headers=headers)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Spring users fetch failed.",
        )


@router.get("/components")
async def spring_components(request: Request, _principal=Depends(get_current_principal)):
    try:
        headers = {"Authorization": request.headers.get("authorization")} if request.headers.get("authorization") else None
        return await SpringService.get_components(headers=headers)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Spring components fetch failed.",
        )


@router.get("/reviews")
async def spring_reviews(request: Request, _principal=Depends(get_current_principal)):
    try:
        headers = {"Authorization": request.headers.get("authorization")} if request.headers.get("authorization") else None
        return await SpringService.get_reviews(headers=headers)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Spring reviews fetch failed.",
        )


@router.get("/health")
async def spring_health(request: Request):
    try:
        headers = {"Authorization": request.headers.get("authorization")} if request.headers.get("authorization") else None
        return await SpringService.check_health(headers=headers)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Spring health check failed.",
        )
