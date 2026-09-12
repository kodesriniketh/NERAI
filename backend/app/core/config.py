from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "NERA"
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    # We will add supabase connection details here later

    class Config:
        env_file = ".env"

settings = Settings()
