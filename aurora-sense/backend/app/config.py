from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    noaa_kp_url: str = "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json"
    noaa_forecast_url: str = "https://services.swpc.noaa.gov/json/planetary_k_index_forecast.json"
    kp_refresh_interval_seconds: int = 60
    cors_origins: list[str] = ["http://localhost:5173"]

    class Config:
        env_file = ".env"

settings = Settings()
