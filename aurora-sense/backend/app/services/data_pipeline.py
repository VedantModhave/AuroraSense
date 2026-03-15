import logging
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.swpc_service import (
    fetch_magnetic_field,
    fetch_plasma,
    fetch_aurora_grid,
    fetch_kp_index,
)
from app.config import settings

logger = logging.getLogger(__name__)

# Global in-memory cache for all space weather data
cache: dict = {
    "magnetic_field": None,
    "plasma": None,
    "aurora_grid": None,
    "kp_index": None,
    "last_refresh": None,
}

async def refresh_space_weather_data():
    """
    Background job: fetch all NOAA SWPC data sources and update cache.
    Runs every 60 seconds.
    """
    logger.info("Refreshing space weather data...")
    
    try:
        # Fetch all data sources concurrently
        import asyncio
        results = await asyncio.gather(
            fetch_magnetic_field(),
            fetch_plasma(),
            fetch_aurora_grid(),
            fetch_kp_index(),
            return_exceptions=True,
        )

        # Update cache with successful results
        cache["magnetic_field"] = results[0] if not isinstance(results[0], Exception) else cache.get("magnetic_field")
        cache["plasma"] = results[1] if not isinstance(results[1], Exception) else cache.get("plasma")
        cache["aurora_grid"] = results[2] if not isinstance(results[2], Exception) else cache.get("aurora_grid")
        cache["kp_index"] = results[3] if not isinstance(results[3], Exception) else cache.get("kp_index")
        cache["last_refresh"] = datetime.utcnow().isoformat() + "Z"

        # Log status
        success_count = sum(1 for r in results if not isinstance(r, Exception))
        logger.info(f"Space weather refresh complete: {success_count}/4 sources updated")
        
        if cache["kp_index"]:
            logger.info(f"Current Kp: {cache['kp_index'].current_kp}")

    except Exception as exc:
        logger.error(f"Failed to refresh space weather data: {exc}")

def create_data_pipeline_scheduler() -> AsyncIOScheduler:
    """Create and configure the background data pipeline scheduler."""
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        refresh_space_weather_data,
        trigger="interval",
        seconds=settings.kp_refresh_interval_seconds,
        id="space_weather_refresh",
        replace_existing=True,
    )
    return scheduler
