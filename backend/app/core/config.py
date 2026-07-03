from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "EduBridge MOOC Platform API"
    FIREBASE_SERVICE_ACCOUNT_PATH: str = os.getenv(
        "FIREBASE_SERVICE_ACCOUNT_PATH",
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "mooc-blended-firebase-adminsdk-fbsvc-1bf71dac6e.json"))
    )
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    @property
    def cors_origins_list(self) -> List[str]:
        raw = os.getenv("FRONTEND_URL", self.FRONTEND_URL)
        return [origin.strip() for origin in raw.split(",") if origin.strip()] or ["http://localhost:5173"]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
