from pathlib import Path

from pydantic_settings import BaseSettings

# .env lives at the project root (one level above backend/).
# config.py is at SafeWalk/backend/app/config.py, so three parents up is SafeWalk/.
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
_ENV_FILE = _PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    database_url: str = "postgresql://safewalk:safewalk@localhost:5433/safewalk"
    google_maps_api_key: str = ""
    use_mock_data: bool = True
    scoring_engine: str = "mock"
    # "london" -> real Barnet data in app/data/
    # "mock"   -> synthetic Clayton data in app/mock_data/
    data_source: str = "london"

    model_config = {"env_file": str(_ENV_FILE)}


settings = Settings()
