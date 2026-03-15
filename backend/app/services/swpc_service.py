import httpx
import logging
from datetime import datetime
from typing import Optional
from app.models.space_weather import (
    MagneticFieldData,
    MagneticFieldReading,
    PlasmaData,
    PlasmaReading,
    AuroraGridData,
    AuroraGridPoint,
    KpIndexData,
    KpReading,
)

logger = logging.getLogger(__name__)

# NOAA SWPC API endpoints
MAG_URL = "https://services.swpc.noaa.gov/products/solar-wind/mag-1-day.json"
PLASMA_URL = "https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json"
AURORA_GRID_URL = "https://services.swpc.noaa.gov/json/ovation_aurora_latest.json"
KP_URL = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json"

async def fetch_magnetic_field() -> Optional[MagneticFieldData]:
    """
    Fetch 1-day magnetic field data.
    Format: [["time_tag","bx_gsm","by_gsm","bz_gsm","lon_gsm","lat_gsm","bt"], [...], ...]
    """
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(MAG_URL)
            resp.raise_for_status()
            data = resp.json()

        if not data or len(data) < 2:
            return None

        # Skip header row
        readings = []
        for row in data[1:]:
            try:
                readings.append(
                    MagneticFieldReading(
                        time_tag=row[0],
                        bx_gsm=float(row[1]) if row[1] not in [None, "", "-999.9"] else None,
                        by_gsm=float(row[2]) if row[2] not in [None, "", "-999.9"] else None,
                        bz_gsm=float(row[3]) if row[3] not in [None, "", "-999.9"] else None,
                        bt=float(row[6]) if len(row) > 6 and row[6] not in [None, "", "-999.9"] else None,
                    )
                )
            except (ValueError, IndexError):
                continue

        return MagneticFieldData(
            readings=readings[-100:],  # Keep last 100 readings
            last_updated=readings[-1].time_tag if readings else None,
        )
    except Exception as e:
        logger.error(f"Failed to fetch magnetic field data: {e}")
        return None

async def fetch_plasma() -> Optional[PlasmaData]:
    """
    Fetch 1-day solar wind plasma data.
    Format: [["time_tag","density","speed","temperature"], [...], ...]
    """
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(PLASMA_URL)
            resp.raise_for_status()
            data = resp.json()

        if not data or len(data) < 2:
            return None

        readings = []
        for row in data[1:]:
            try:
                readings.append(
                    PlasmaReading(
                        time_tag=row[0],
                        density=float(row[1]) if row[1] not in [None, "", "-999.9"] else None,
                        speed=float(row[2]) if row[2] not in [None, "", "-999.9"] else None,
                        temperature=float(row[3]) if row[3] not in [None, "", "-999.9"] else None,
                    )
                )
            except (ValueError, IndexError):
                continue

        return PlasmaData(
            readings=readings[-100:],
            last_updated=readings[-1].time_tag if readings else None,
        )
    except Exception as e:
        logger.error(f"Failed to fetch plasma data: {e}")
        return None

async def fetch_aurora_grid() -> Optional[AuroraGridData]:
    """
    Fetch aurora probability grid.
    Format: {"Observation Time":"...","Forecast Time":"...","coordinates":[[lon,lat,prob],...],"type":"..."}
    """
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(AURORA_GRID_URL)
            resp.raise_for_status()
            data = resp.json()

        if not data or "coordinates" not in data:
            return None

        points = [
            AuroraGridPoint(
                coordinates=[coord[0], coord[1]],
                aurora_probability=int(coord[2]),
            )
            for coord in data["coordinates"]
            if len(coord) >= 3
        ]

        return AuroraGridData(
            observation_time=data.get("Observation Time", ""),
            forecast_time=data.get("Forecast Time", ""),
            points=points,
        )
    except Exception as e:
        logger.error(f"Failed to fetch aurora grid: {e}")
        return None

async def fetch_kp_index() -> Optional[KpIndexData]:
    """
    Fetch Kp index data.
    Format: [["time_tag","kp","observed","noaa_scale"], [...], ...]
    """
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(KP_URL)
            resp.raise_for_status()
            data = resp.json()

        if not data or len(data) < 2:
            return None

        readings = []
        for row in data[1:]:
            try:
                kp_val = float(row[1])
                readings.append(
                    KpReading(
                        time_tag=row[0],
                        kp=kp_val,
                        observed=row[2],
                        noaa_scale=row[3] if len(row) > 3 and row[3] else None,
                    )
                )
            except (ValueError, IndexError):
                continue

        current_kp = readings[-1].kp if readings else 0.0

        return KpIndexData(
            current_kp=current_kp,
            readings=readings[-50:],
            last_updated=readings[-1].time_tag if readings else None,
        )
    except Exception as e:
        logger.error(f"Failed to fetch Kp index: {e}")
        return None
