"""Search controller for forwarding search requests."""
from fastapi import APIRouter, HTTPException, status
import sys
from pathlib import Path

# Add parent directory to path for relative imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from gateway.models.schemas import SearchSchema
    from gateway.services.searchService import SearchService
except ImportError:
    from models.schemas import SearchSchema
    from services.searchService import SearchService

router = APIRouter(prefix="/searchservice", tags=["search"])


@router.post("/search")
async def search(payload: SearchSchema):
    """Perform semantic search.
    
    Args:
        payload: Search query with limit
        
    Returns:
        Search results
    """
    try:
        result = await SearchService.search(
            query=payload.query,
            limit=payload.limit,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}",
        )


@router.get("/history")
async def get_search_history():
    """Get search history from logs.
    
    Returns:
        Search history
    """
    try:
        result = await SearchService.get_search_history()
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"History fetch failed: {str(e)}",
        )


@router.get("/health")
async def search_health():
    """Check search service health.
    
    Returns:
        Health status
    """
    try:
        result = await SearchService.check_health()
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Health check failed: {str(e)}",
        )
