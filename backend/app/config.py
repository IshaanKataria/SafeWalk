from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://safewalk:safewalk@localhost:5433/safewalk"
    google_maps_api_key: str = ""
    use_mock_data: bool = True
    scoring_engine: str = "mock"
    # "london" -> real Wandsworth data in app/data/
    # "mock"   -> synthetic Clayton data in app/mock_data/
    data_source: str = "london"

    model_config = {"env_file": ".env"}


settings = Settings()
