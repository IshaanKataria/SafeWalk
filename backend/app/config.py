from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://safewalk:safewalk@localhost:5433/safewalk"
    google_maps_api_key: str = ""
    use_mock_data: bool = True
    scoring_engine: str = "mock"

    model_config = {"env_file": ".env"}


settings = Settings()
