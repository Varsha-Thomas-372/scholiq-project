from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    anthropic_api_key: str = ""
    youtube_api_key: str = ""
    serpapi_key: str = ""
    azure_sql_connstr: str = ""
    azure_storage_account: str = ""
    azure_storage_key: str = ""
    azure_keyvault_uri: str = ""
    cors_origins: str = "http://localhost:5173,https://*.azurewebsites.net"


@lru_cache
def get_settings() -> Settings:
    return Settings()
