from pydantic import BaseModel, Field


class ScoreSegmentRequest(BaseModel):
    lat: float = Field(description="Latitude")
    lng: float = Field(description="Longitude")
    time_of_day: int = Field(ge=0, le=23, description="Hour of day (0-23)")


class ScoreSegmentResponse(BaseModel):
    safety_score: int = Field(ge=0, le=100, description="Safety score 0-100")
    factors: dict | None = Field(default=None, description="Score breakdown")
