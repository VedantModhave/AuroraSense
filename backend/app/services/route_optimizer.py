"""
Aurora viewing route optimizer service.
Finds optimal viewing locations and generates routes.

Strategy: best-effort scoring — always returns the best available location
within the search radius, with a `meets_criteria` flag indicating whether
all user thresholds were satisfied.
"""
import asyncio
import logging
import httpx
from typing import List, Dict, Optional
from datetime import datetime, timezone
from app.services.visibility_engine import get_aurora_probability_at_location
from app.services.weather_service import fetch_cloud_cover, fetch_bulk_cloud_cover
from app.services.light_pollution_service import estimate_bortle_scale

logger = logging.getLogger(__name__)

OSRM_BASE_URL = "https://router.project-osrm.org"


def _generate_candidate_coords(
    origin_lat: float,
    origin_lon: float,
    search_radius_km: float,
) -> List[tuple]:
    """
    Generate a denser grid of candidate (lat, lon) pairs within the search radius.
    Uses a 7×7 grid (48 points, skipping origin) for better coverage.
    """
    radius_deg = search_radius_km / 111.0
    step = radius_deg / 3  # 7 steps across the diameter

    coords = []
    for lat_offset in range(-3, 4):
        for lon_offset in range(-3, 4):
            if lat_offset == 0 and lon_offset == 0:
                continue
            lat = origin_lat + lat_offset * step
            lon = origin_lon + lon_offset * step
            # Clamp to valid ranges
            lat = max(-89.0, min(89.0, lat))
            lon = ((lon + 180) % 360) - 180
            coords.append((lat, lon))

    return coords




async def find_optimal_viewing_locations(
    origin_lat: float,
    origin_lon: float,
    search_radius_km: float = 100,
    min_aurora_probability: float = 50,
    max_cloud_cover: float = 30,
    max_bortle: int = 4,
) -> List[Dict]:
    """
    Evaluate all candidate locations concurrently and return them sorted by score.

    Two passes:
    1. Candidates that meet ALL thresholds (strict).
    2. If none found, return best-effort candidates sorted by score with
       `meets_criteria=False` so the UI can warn the user.
    """
    coords = _generate_candidate_coords(origin_lat, origin_lon, search_radius_km)

    # Fetch all cloud covers in one network batch
    clouds = await fetch_bulk_cloud_cover(coords)

    evaluated = []
    for i, (lat, lon) in enumerate(coords):
        try:
            aurora_prob = get_aurora_probability_at_location(lat, lon) or 0.0
            
            # Map pre-fetched cloud array to this coordinate
            cloud_cover = clouds[i] if i < len(clouds) else 50.0
            bortle = estimate_bortle_scale(lat, lon)

            score = (
                (aurora_prob * 0.5) +
                ((100 - cloud_cover) * 0.3) +
                ((10 - bortle) * 10 * 0.2)
            )

            evaluated.append({
                "latitude": lat,
                "longitude": lon,
                "aurora_probability": round(aurora_prob, 2),
                "cloud_cover": round(cloud_cover, 2),
                "bortle_scale": bortle,
                "score": round(score, 2),
            })
        except Exception as e:
            logger.debug(f"Skipping ({lat:.2f}, {lon:.2f}): {e}")

    if not evaluated:
        return []

    # Sort all by score descending
    evaluated.sort(key=lambda x: x["score"], reverse=True)

    # Strict pass — all thresholds met
    strict = [
        {**loc, "meets_criteria": True}
        for loc in evaluated
        if loc["aurora_probability"] >= min_aurora_probability
        and loc["cloud_cover"] <= max_cloud_cover
        and loc["bortle_scale"] <= max_bortle
    ]

    if strict:
        return strict

    # Best-effort pass — return top candidates even if thresholds not met
    return [{**loc, "meets_criteria": False} for loc in evaluated]


async def get_route_to_location(
    origin_lat: float,
    origin_lon: float,
    dest_lat: float,
    dest_lon: float,
    profile: str = "driving",
) -> Optional[Dict]:
    """Get driving/cycling/walking route from OSRM."""
    try:
        url = (
            f"{OSRM_BASE_URL}/route/v1/{profile}"
            f"/{origin_lon},{origin_lat};{dest_lon},{dest_lat}"
        )
        params = {
            "overview": "full",
            "geometries": "geojson",
            "steps": "true",
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

        if data.get("code") != "Ok":
            logger.warning(f"OSRM error: {data.get('message')}. Using fallback route.")
            return _fallback_route(origin_lat, origin_lon, dest_lat, dest_lon)

        route = data["routes"][0]
        return {
            "distance_km": round(route["distance"] / 1000, 2),
            "duration_minutes": round(route["duration"] / 60, 2),
            "geometry": route["geometry"],
            "steps": _extract_steps(route),
        }

    except Exception as e:
        logger.warning(f"OSRM routing failed: {e}. Using fallback route.")
        return _fallback_route(origin_lat, origin_lon, dest_lat, dest_lon)


def _extract_steps(route: Dict) -> List[Dict]:
    steps = []
    for leg in route.get("legs", []):
        for step in leg.get("steps", []):
            maneuver = step.get("maneuver", {})
            steps.append({
                "instruction": maneuver.get("instruction", "Continue"),
                "distance_m": round(step.get("distance", 0)),
                "duration_s": round(step.get("duration", 0)),
                "type": maneuver.get("type", "turn"),
            })
    return steps


def _fallback_route(orig_lat: float, orig_lon: float, dest_lat: float, dest_lon: float) -> Dict:
    import math
    def haversine(lat1, lon1, lat2, lon2):
        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    dist_km = haversine(orig_lat, orig_lon, dest_lat, dest_lon)
    return {
        "distance_km": round(dist_km, 2),
        "duration_minutes": round((dist_km / 80.0) * 60, 2),
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [orig_lon, orig_lat],
                [dest_lon, dest_lat]
            ]
        },
        "steps": [{
            "instruction": "Head directly to destination (straight line fallback)",
            "distance_m": round(dist_km * 1000),
            "duration_s": round((dist_km / 80.0) * 3600),
            "type": "straight"
        }],
        "is_fallback": True
    }


async def optimize_aurora_viewing_route(
    origin_lat: float,
    origin_lon: float,
    search_radius_km: float = 100,
    min_aurora_probability: float = 50,
    max_cloud_cover: float = 30,
    max_bortle: int = 4,
    profile: str = "driving",
) -> Optional[Dict]:
    """
    Main entry point: find best location + generate route.

    Always returns a result if any candidates exist (best-effort).
    The `destination.meets_criteria` field tells the caller whether
    all user thresholds were satisfied.
    """
    locations = await find_optimal_viewing_locations(
        origin_lat, origin_lon,
        search_radius_km,
        min_aurora_probability,
        max_cloud_cover,
        max_bortle,
    )

    if not locations:
        return None

    best = locations[0]

    route = await get_route_to_location(
        origin_lat, origin_lon,
        best["latitude"], best["longitude"],
        profile,
    )

    if not route:
        return None

    return {
        "origin": {"latitude": origin_lat, "longitude": origin_lon},
        "destination": best,
        "route": route,
        "alternative_locations": locations[1:6],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
