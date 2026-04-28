"""Authentication controller for forwarding auth requests."""
from fastapi import APIRouter, HTTPException, status
import sys
from pathlib import Path

# Add parent directory to path for relative imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from gateway.models.schemas import SignupSchema, SigninSchema
    from gateway.services.authService import AuthService
except ImportError:
    from models.schemas import SignupSchema, SigninSchema
    from services.authService import AuthService

router = APIRouter(prefix="/authservice", tags=["authentication"])


@router.post("/signup")
async def signup(payload: SignupSchema):
    """Register new user.
    
    Args:
        payload: Signup credentials
        
    Returns:
        User data and auth token
    """
    try:
        result = await AuthService.signup(payload.model_dump())
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Signup failed.",
        )


@router.post("/register")
async def register(payload: SignupSchema):
    return await signup(payload)


@router.post("/signin")
async def signin(payload: SigninSchema):
    """Authenticate user.
    
    Args:
        payload: Login credentials
        
    Returns:
        User data and auth token
    """
    try:
        result = await AuthService.signin(payload.model_dump())
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Signin failed.",
        )


@router.post("/login")
async def login(payload: SigninSchema):
    return await signin(payload)


@router.post("/refresh")
async def refresh(payload: dict | None = None):
    """Refresh auth session and return a new access token."""
    try:
        result = await AuthService.refresh(payload or {})
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Refresh failed.",
        )


@router.post("/logout")
async def logout():
    """Logout user.
    
    Returns:
        Success message
    """
    try:
        result = await AuthService.logout()
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed.",
        )


@router.get("/csrf")
async def get_csrf():
    """Get CSRF token.
    
    Returns:
        CSRF token
    """
    try:
        result = await AuthService.get_csrf()
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="CSRF fetch failed.",
        )
