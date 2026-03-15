import logging
import math
from typing import Optional, Dict, Any, List
from app.services.data_pipeline import cache

logger = logging.getLogger(__name__)

# OVATION grid dimensions
GRID_COLS = 360   # longitude bins (0–359)
GRID_ROWS = 181   # latitude bins (0–180 → -90° to +90°)


def _normalize_coords(raw_lon: float, raw_lat: float):
    """
    Correctly project OVATION grid indices to WGS-84 lon/lat.

    NOAA OVATION provides coords already as:
      lon ∈ [0, 359]  (integer degrees)
      lat ∈ [-90, 90] (integer degrees)

    For grid-index format (if ever used):
      longitude = (grid_x / GRID_COLS) * 360 - 180
      latitude  = (grid_y / GRID_ROWS) * 180 - 90
    """
    lon = raw_lon
    lat = raw_lat

    # Normalize longitude 0-360 → -180..180
    if lon > 180:
        lon = lon - 360

    # Clamp to valid ranges
    lon = max(-180.0, min(180.0, lon))
    lat = max(-90.0, min(90.0, lat))
    return lon, lat


def convert_aurora_grid_to_geojson() -> Optional[Dict[str, Any]]:
    """
    Convert OVATION aurora probability grid to GeoJSON FeatureCollection.

    OVATION grid format:
    - 360 longitude bins (0–359°)
    - 181 latitude bins (-90° to +90°)
    - Each point: [longitude, latitude, probability]

    Only skips points where probability == 0 to keep payload manageable.
    Returns GeoJSON with Point features containing aurora probability.
    """
    aurora_grid = cache.get("aurora_grid")

    if not aurora_grid or not aurora_grid.points:
        logger.warning("No aurora grid data available for GeoJSON conversion")
        return None

    try:
        features = []
        zero_count = 0

        for point in aurora_grid.points:
            # Only skip truly zero-probability points to reduce payload
            if point.aurora_probability == 0:
                zero_count += 1
                continue

            lon, lat = _normalize_coords(point.coordinates[0], point.coordinates[1])

            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [round(lon, 2), round(lat, 2)]
                },
                "properties": {
                    "probability": point.aurora_probability
                }
            }
            features.append(feature)

        total_input = len(aurora_grid.points)
        logger.info(
            f"GeoJSON: {len(features)} non-zero aurora points "
            f"({zero_count} zero-prob skipped, {total_input} total)"
        )

        return {
            "type": "FeatureCollection",
            "features": features,
            "metadata": {
                "observation_time": aurora_grid.observation_time,
                "forecast_time": aurora_grid.forecast_time,
                "total_points": len(features),
                "total_grid_points": total_input,
                "zero_probability_skipped": zero_count,
                "grid_resolution": "1° x 1°",
                "expected_grid_size": GRID_COLS * GRID_ROWS,
            }
        }

    except Exception as e:
        logger.error(f"Failed to convert aurora grid to GeoJSON: {e}")
        return None


def get_aurora_hotspots(min_probability: int = 50) -> Optional[Dict[str, Any]]:
    """
    Extract high-probability aurora regions as GeoJSON.
    """
    aurora_grid = cache.get("aurora_grid")

    if not aurora_grid or not aurora_grid.points:
        return None

    try:
        features = []

        for point in aurora_grid.points:
            if point.aurora_probability >= min_probability:
                lon, lat = _normalize_coords(point.coordinates[0], point.coordinates[1])

                feature = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [round(lon, 2), round(lat, 2)]
                    },
                    "properties": {
                        "probability": point.aurora_probability,
                        "intensity": "high" if point.aurora_probability >= 75 else "moderate"
                    }
                }
                features.append(feature)

        return {
            "type": "FeatureCollection",
            "features": features,
            "metadata": {
                "min_probability": min_probability,
                "hotspot_count": len(features),
                "observation_time": aurora_grid.observation_time,
            }
        }

    except Exception as e:
        logger.error(f"Failed to extract aurora hotspots: {e}")
        return None


def get_aurora_oval_outline(threshold: int = 20) -> Optional[Dict[str, Any]]:
    """
    Compute the aurora oval outline based on probability threshold.

    1. Filter grid points where probability > threshold
    2. For each longitude bin, compute the min/max latitude extent
    3. Return outer boundary as a closed LineString ring

    Returns GeoJSON LineString feature representing the aurora oval.
    """
    aurora_grid = cache.get("aurora_grid")

    if not aurora_grid or not aurora_grid.points:
        return None

    try:
        # Collect high-probability points
        high_prob = []
        for point in aurora_grid.points:
            if point.aurora_probability >= threshold:
                lon, lat = _normalize_coords(point.coordinates[0], point.coordinates[1])
                high_prob.append((lon, lat, point.aurora_probability))

        if len(high_prob) < 3:
            return None

        # Group by rounded longitude (1° bins) to find lat extent per longitude
        lon_bins: Dict[int, list] = {}
        for lon, lat, prob in high_prob:
            key = int(round(lon))
            if key not in lon_bins:
                lon_bins[key] = []
            lon_bins[key].append(lat)

        # Build poleward (outer) and equatorward (inner) boundary rings
        outer_ring = []  # poleward boundary (highest abs latitude, signed)
        inner_ring = []  # equatorward boundary

        for lon_key in sorted(lon_bins.keys()):
            lats = lon_bins[lon_key]
            outer_ring.append([lon_key, max(lats)])
            inner_ring.append([lon_key, min(lats)])

        # Close the rings
        if outer_ring:
            outer_ring.append(outer_ring[0])
        if inner_ring:
            inner_ring.append(inner_ring[0])

        # Build a polygon from outer+inner boundaries
        polygon_coords = [outer_ring, list(reversed(inner_ring))]

        return {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": polygon_coords
            },
            "properties": {
                "threshold": threshold,
                "point_count": len(high_prob),
            }
        }

    except Exception as e:
        logger.error(f"Failed to compute aurora oval outline: {e}")
        return None


def get_aurora_contours(probability_levels: List[int] = [25, 50, 75]) -> Optional[Dict[str, Any]]:
    """
    Generate contour-like groupings of aurora probability regions.
    """
    aurora_grid = cache.get("aurora_grid")

    if not aurora_grid or not aurora_grid.points:
        return None

    try:
        level_groups = {level: [] for level in probability_levels}

        for point in aurora_grid.points:
            prob = point.aurora_probability

            for level in sorted(probability_levels, reverse=True):
                if prob >= level:
                    lon, lat = _normalize_coords(point.coordinates[0], point.coordinates[1])

                    level_groups[level].append({
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [round(lon, 2), round(lat, 2)]
                        },
                        "properties": {
                            "probability": prob,
                            "level": level
                        }
                    })
                    break

        all_features = []
        for level, features in level_groups.items():
            all_features.extend(features)

        return {
            "type": "FeatureCollection",
            "features": all_features,
            "metadata": {
                "probability_levels": probability_levels,
                "level_counts": {level: len(feats) for level, feats in level_groups.items()},
                "observation_time": aurora_grid.observation_time,
            }
        }

    except Exception as e:
        logger.error(f"Failed to generate aurora contours: {e}")
        return None
