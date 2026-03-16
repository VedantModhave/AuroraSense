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
AURORA_GRID_URL = "https://services.swpc.noaa.gov/json/ovation_aurora_latest.json"
KP_URL = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json"

MAG_SOURCES = [
    ("DSCOVR", "https://services.swpc.noaa.gov/products/solar-wind/mag-1-day.json"),
    ("ACE", "https://services.swpc.noaa.gov/products/solar-wind/mag-7-day.json"),  # Fallback
]

PLASMA_SOURCES = [
    ("DSCOVR", "https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json"),
    ("ACE", "https://services.swpc.noaa.gov/products/solar-wind/plasma-7-day.json"),  # Fallback
]

async def fetch_magnetic_field() -> Optional[MagneticFieldData]:
    """
    Fetch magnetic field data with failover between DSCOVR and ACE.
    """
    for source_name, url in MAG_SOURCES:
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                data = resp.json()

            if not data or len(data) < 2:
                continue

            readings = []
            for row in data[1:]:
                # Data may have gaps indicated by empty values
                try:
                    readings.append(
                        MagneticFieldReading(
                            time_tag=row[0],
                            bx_gsm=float(row[1]) if row[1] not in [None, "", "-999.9", "-999"] else None,
                            by_gsm=float(row[2]) if row[2] not in [None, "", "-999.9", "-999"] else None,
                            bz_gsm=float(row[3]) if row[3] not in [None, "", "-999.9", "-999"] else None,
                            bt=float(row[6]) if len(row) > 6 and row[6] not in [None, "", "-999.9", "-999"] else None,
                        )
                    )
                except (ValueError, IndexError):
                    continue

            # Check for data gaps (e.g., fewer readings recently or gaps in time)
            data_gap = False
            if len(readings) < 10:
                data_gap = True
            elif readings[-1].bz_gsm is None:
                data_gap = True

            if readings:
                return MagneticFieldData(
                    readings=readings[-100:],
                    last_updated=readings[-1].time_tag,
                    source=source_name,
                    data_gap=data_gap
                )
        except Exception as e:
            logger.warning(f"Failed to fetch magnetic field from {source_name}: {e}. Failing over...")
            continue
            
    logger.error("All magnetic field satellite sources failed.")
    return None

async def fetch_plasma() -> Optional[PlasmaData]:
    """
    Fetch solar wind plasma data with failover between DSCOVR and ACE.
    """
    for source_name, url in PLASMA_SOURCES:
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                data = resp.json()

            if not data or len(data) < 2:
                continue

            readings = []
            for row in data[1:]:
                try:
                    readings.append(
                        PlasmaReading(
                            time_tag=row[0],
                            density=float(row[1]) if row[1] not in [None, "", "-999.9", "-999"] else None,
                            speed=float(row[2]) if row[2] not in [None, "", "-999.9", "-999"] else None,
                            temperature=float(row[3]) if row[3] not in [None, "", "-999.9", "-999"] else None,
                        )
                    )
                except (ValueError, IndexError):
                    continue
                    
            data_gap = False
            if len(readings) < 10 or readings[-1].speed is None:
                data_gap = True

            if readings:
                return PlasmaData(
                    readings=readings[-100:],
                    last_updated=readings[-1].time_tag,
                    source=source_name,
                    data_gap=data_gap
                )
        except Exception as e:
            logger.warning(f"Failed to fetch plasma data from {source_name}: {e}. Failing over...")
            continue
            
    logger.error("All plasma satellite sources failed.")
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
