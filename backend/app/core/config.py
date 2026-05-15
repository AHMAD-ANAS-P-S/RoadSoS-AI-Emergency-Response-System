from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    anthropic_api_key: str = ""
    gemini_api_key: str = ""
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_from_number: str = ""
    telegram_bot_token: str = ""
    database_url: str = "sqlite:///./roadsos.db"
    allowed_origins: List[str] = ["http://localhost:5173", "https://roadsos.vercel.app"]
    secret_key: str = "roadsos-secret-change-in-production"
    debug: bool = False

    class Config:
        env_file = ".env"

settings = Settings()
