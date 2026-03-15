import httpx
from app.models.aurora import KpData, KpEntry, AuroraForecast, ForecastEntry
from app.utils.kp_utils import kp_to_visibility_latitude
from app.config import settings

async def fetch_kp_index() -> KpData:
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(settings.noaa_kp_url)
        resp.raise_for_status()
        data = resp.json()

    entries = [
        KpEntry(time_tag=row[0], kp=float(row[1]), source=row[2])
        for row in data[-12:]
    ]
    current_kp = entries[-1].kp if entries else 0.0
    return KpData(current_kp=current_kp, entries=entries)

async def fetch_aurora_forecast() -> AuroraForecast:
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(settings.noaa_forecast_url)
        resp.raise_for_status()
        data = resp.json()

    forecast = [
        ForecastEntry(
            time_tag=row[0],
            kp_index=float(row[1]),
            visibility_latitude=kp_to_visibility_latitude(float(row[1])),
        )
        for row in data
    ]
    updated_at = data[0][0] if data else None
    return AuroraForecast(forecast=forecast, updated_at=updated_at)
