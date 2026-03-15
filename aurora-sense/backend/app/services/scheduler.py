import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.noaa_service import fetch_kp_index, fetch_aurora_forecast
from app.config import settings

logger = logging.getLogger(__name__)

# In-memory cache shared across requests
cache: dict = {
    "kp": None,
    "forecast": None,
}

async def refresh_noaa_data():
    """Background job: fetch and cache latest NOAA data."""
    try:
        cache["kp"] = await fetch_kp_index()
        cache["forecast"] = await fetch_aurora_forecast()
        logger.info("NOAA data refreshed. Kp=%.1f", cache["kp"].current_kp)
    except Exception as exc:
        logger.warning("Failed to refresh NOAA data: %s", exc)

def create_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        refresh_noaa_data,
        trigger="interval",
        seconds=settings.kp_refresh_interval_seconds,
        id="noaa_refresh",
        replace_existing=True,
    )
    return scheduler
