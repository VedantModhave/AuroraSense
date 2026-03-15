from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import aurora, health, space_weather, aurora_map, visibility, route_optimizer, sightings
from app.services.data_pipeline import create_data_pipeline_scheduler, refresh_space_weather_data

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm up cache immediately on startup
    await refresh_space_weather_data()
    
    # Start background scheduler for continuous updates
    scheduler = create_data_pipeline_scheduler()
    scheduler.start()
    
    yield
    
    scheduler.shutdown()

app = FastAPI(
    title="AuroraSense API",
    version="1.0.0",
    description="Real-time aurora forecasting powered by NOAA space weather data",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(health.router) # Now available at /health thanks to router rewrite or we can prefix /api but requirements say GET /health
app.include_router(aurora.router, prefix="/api/aurora")
app.include_router(space_weather.router, prefix="/api")
app.include_router(aurora_map.router, prefix="/api")
app.include_router(visibility.router, prefix="/api")
app.include_router(route_optimizer.router)
app.include_router(sightings.router, prefix="/api")
