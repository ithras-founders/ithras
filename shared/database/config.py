"""
Centralized application configuration.
All environment variables are read here; modules import `settings` instead of calling os.getenv().
"""
import os


class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "/app/uploads")
    ASSETS_COMPANIES_DIR: str = os.getenv(
        "ASSETS_COMPANIES_DIR",
        os.path.join(os.path.dirname(os.getenv("UPLOAD_DIR", "/app/uploads")), "assets", "companies"),
    )
    REDIS_URL: str = os.getenv("REDIS_URL", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    GEMINI_BASE_URL: str = os.getenv("GEMINI_BASE_URL", "")
    GEMINI_ACCESS_TOKEN: str = os.getenv("GEMINI_ACCESS_TOKEN", "")
    GEMINI_PROJECT: str = os.getenv("GEMINI_PROJECT", "")
    GEMINI_LOCATION: str = os.getenv("GEMINI_LOCATION", "")
    DEMO_PASSWORD: str = os.getenv("DEMO_PASSWORD", "password")
    LOG_FORMAT: str = os.getenv("LOG_FORMAT", "text").lower()
    SQL_ECHO: bool = os.getenv("SQL_ECHO", "false").lower() == "true"
    IS_CLOUD_RUN: bool = bool(os.getenv("K_SERVICE"))
    REQUIRE_DATABASE: bool = os.getenv("REQUIRE_DATABASE", "").strip().lower() in {"1", "true", "yes"}
    SKIP_PDF_AI: bool = os.getenv("SKIP_PDF_AI", "0").lower() in ("1", "true", "yes")
    DB_SETUP: bool = os.getenv("DB_SETUP", "").strip().upper() in {"TRUE", "1", "YES"}


settings = Settings()
