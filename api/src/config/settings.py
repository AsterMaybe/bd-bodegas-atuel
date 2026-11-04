from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Configuración de la API cargada desde variables de entorno."""

    port: int = Field(default=8000, alias="PORT")
    env: str = Field(default="development", alias="ENV")
    database_url: str = Field(alias="DATABASE_URL")
    db_pool_min: int = Field(default=2, alias="DB_POOL_MIN")
    db_pool_max: int = Field(default=10, alias="DB_POOL_MAX")
    db_idle_timeout: int = Field(default=30000, alias="DB_IDLE_TIMEOUT")
    db_connection_timeout: int = Field(default=5000, alias="DB_CONNECTION_TIMEOUT")
    log_level: str = Field(default="info", alias="LOG_LEVEL")

    model_config = {
        "env_file": ["../.env", ".env"],
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore",
    }

    @property
    def is_production(self) -> bool:
        return self.env == "production"


_settings: Settings | None = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings


def reset_settings() -> None:
    global _settings
    _settings = None