"""Component controller for forwarding component requests."""
from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional
import sys
from pathlib import Path

# Add parent directory to path for relative imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from gateway.models.schemas import ComponentSchema
    from gateway.services.componentService import ComponentService
except ImportError:
    from models.schemas import ComponentSchema
    from services.componentService import ComponentService

router = APIRouter(prefix="/componentservice", tags=["components"])


@router.get("/components")
async def list_components(category: Optional[str] = Query(None, description="Category filter")):
    """List components with optional category filter.
    
    Args:
        category: Optional category to filter by
        
    Returns:
        Components list
    """
    try:
        result = await ComponentService.list_components(category=category)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"List components failed: {str(e)}",
        )


@router.get("/components/{component_id}")
async def get_component(component_id: str):
    """Get single component by ID.
    
    Args:
        component_id: Component ID
        
    Returns:
        Component details
    """
    try:
        result = await ComponentService.get_component(component_id)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Get component failed: {str(e)}",
        )


@router.post("/components")
async def create_component(payload: ComponentSchema):
    """Create new component.
    
    Args:
        payload: Component data
        
    Returns:
        Created component
    """
    try:
        result = await ComponentService.create_component(payload.model_dump())
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Create component failed: {str(e)}",
        )


@router.put("/components/{component_id}")
async def update_component(component_id: str, payload: ComponentSchema):
    """Update component.
    
    Args:
        component_id: Component ID
        payload: Updated component data
        
    Returns:
        Updated component
    """
    try:
        result = await ComponentService.update_component(component_id, payload.model_dump())
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Update component failed: {str(e)}",
        )


@router.delete("/components/{component_id}")
async def delete_component(component_id: str):
    """Delete component.
    
    Args:
        component_id: Component ID
        
    Returns:
        Success message
    """
    try:
        result = await ComponentService.delete_component(component_id)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Delete component failed: {str(e)}",
        )
