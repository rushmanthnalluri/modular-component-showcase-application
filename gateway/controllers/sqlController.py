"""SQL controller for forwarding SQL catalog operations."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
import sys
from pathlib import Path

# Add parent directory to path for relative imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from gateway.models.schemas import SQLComponentSchema
    from gateway.services.sqlService import SQLService
    from gateway.dependencies.security import get_current_principal
except ImportError:
    from models.schemas import SQLComponentSchema
    from services.sqlService import SQLService
    from dependencies.security import get_current_principal

router = APIRouter(prefix="/sqlservice", tags=["sql"], dependencies=[Depends(get_current_principal)])


@router.get("/components")
async def list_components(
    search: Optional[str] = Query(None, description="Search query"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(25, ge=1, le=100, description="Results per page"),
):
    """List SQL components with optional search.
    
    Args:
        search: Optional search term
        page: Page number for pagination
        limit: Results per page
        
    Returns:
        Components list with pagination
    """
    try:
        result = await SQLService.list_components(
            search=search,
            page=page,
            limit=limit,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="List components failed.",
        )


@router.get("/users")
async def list_users():
    try:
        result = await SQLService.list_users()
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="List users failed.",
        )


@router.get("/categories")
async def list_categories():
    try:
        result = await SQLService.list_categories()
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="List categories failed.",
        )


@router.post("/components")
async def create_component(payload: SQLComponentSchema):
    """Create new SQL component.
    
    Args:
        payload: Component data
        
    Returns:
        Created component
    """
    try:
        result = await SQLService.create_component(payload.model_dump())
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Create component failed.",
        )


@router.put("/components/{component_id}")
async def update_component(component_id: int, payload: SQLComponentSchema):
    """Update SQL component.
    
    Args:
        component_id: Component ID
        payload: Updated component data
        
    Returns:
        Updated component
    """
    try:
        result = await SQLService.update_component(component_id, payload.model_dump())
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Update component failed.",
        )


@router.delete("/components/{component_id}")
async def delete_component(component_id: int):
    """Delete SQL component.
    
    Args:
        component_id: Component ID
        
    Returns:
        Success message
    """
    try:
        result = await SQLService.delete_component(component_id)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Delete component failed.",
        )
