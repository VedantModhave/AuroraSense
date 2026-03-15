from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import aurora, health
from app.services.scheduler import create_scheduler, refresh_noaa_data

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm up cache immediately on startup
    await refresh_noaa_data()
    scheduler = create_scheduler()
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(title="AuroraSense API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(aurora.router, prefix="/api/aurora")
