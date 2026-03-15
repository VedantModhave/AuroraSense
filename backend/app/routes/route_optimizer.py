"""
Route optimizer API endpoints.
"""
from fastapi import APIRouter, HTTPException, Query
from app.models.route import OptimizedRoute, RouteRequest
from app.services.route_optimizer import optimize_aurora_viewing_route

router = APIRouter(prefix="/api/route", tags=["route"])


@router.get("/optimize", response_model=OptimizedRoute)
async def get_optimized_route(
    origin_lat: float = Query(..., ge=-90, le=90),
    origin_lon: float = Query(..., ge=-180, le=180),
    search_radius_km: float = Query(100, ge=10, le=500),
    min_aurora_probability: float = Query(50, ge=0, le=100),
    max_cloud_cover: float = Query(30, ge=0, le=100),
    max_bortle: int = Query(4, ge=1, le=9),
    profile: str = Query("driving", pattern="^(driving|cycling|walking)$"),
):
    """
    Find optimal aurora viewing location and generate GPS route.

    Always returns the best available location within the search radius.
    Check `destination.meets_criteria` to know if all thresholds were satisfied.
    If `meets_criteria` is false, the result is the best-effort location given
    current conditions (e.g. low global aurora activity).
    """
    result = await optimize_aurora_viewing_route(
        origin_lat=origin_lat,
        origin_lon=origin_lon,
        search_radius_km=search_radius_km,
        min_aurora_probability=min_aurora_probability,
        max_cloud_cover=max_cloud_cover,
        max_bortle=max_bortle,
        profile=profile,
    )

    if not result:
        raise HTTPException(
            status_code=503,
            detail="Could not evaluate any candidate locations. Ensure the data pipeline has warmed up (wait ~60s after startup) and try again.",
        )

    return result


@router.post("/optimize", response_model=OptimizedRoute)
async def post_optimized_route(request: RouteRequest):
    """POST version — accepts JSON body."""
    result = await optimize_aurora_viewing_route(
        origin_lat=request.origin_lat,
        origin_lon=request.origin_lon,
        search_radius_km=request.search_radius_km,
        min_aurora_probability=request.min_aurora_probability,
        max_cloud_cover=request.max_cloud_cover,
        max_bortle=request.max_bortle,
        profile=request.profile,
    )

    if not result:
        raise HTTPException(
            status_code=503,
            detail="Could not evaluate any candidate locations. Ensure the data pipeline has warmed up and try again.",
        )

    return result
