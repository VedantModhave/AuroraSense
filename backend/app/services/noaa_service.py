import httpx
from app.models.aurora import KpData, KpEntry, AuroraForecast, ForecastEntry
from app.utils.kp_utils import kp_to_visibility_latitude
from app.config import settings

async def fetch_kp_index() -> KpData:
    """
    NOAA 1-minute Kp feed — returns list of objects:
    {"time_tag": "...", "kp_index": 2, "estimated_kp": 2.0, "kp": "2Z"}
    """
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(settings.noaa_kp_url)
        resp.raise_for_status()
        data = resp.json()

    entries = [
        KpEntry(
            time_tag=row["time_tag"],
            kp=float(row["estimated_kp"]),
            source=row.get("kp", ""),
        )
        for row in data[-12:]
    ]
    current_kp = entries[-1].kp if entries else 0.0
    return KpData(current_kp=current_kp, entries=entries)

async def fetch_aurora_forecast() -> AuroraForecast:
    """
    NOAA forecast feed — returns array-of-arrays, first row is header:
    [["time_tag","kp","observed","noaa_scale"], ["2026-03-08 00:00:00","4.67","observed","G1"], ...]
    """
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(settings.noaa_forecast_url)
        resp.raise_for_status()
        data = resp.json()

    # Skip header row
    rows = data[1:]
    forecast = [
        ForecastEntry(
            time_tag=row[0],
            kp_index=float(row[1]),
            visibility_latitude=kp_to_visibility_latitude(float(row[1])),
        )
        for row in rows
        if row[1] is not None
    ]
    updated_at = rows[0][0] if rows else None
    return AuroraForecast(forecast=forecast, updated_at=updated_at)
