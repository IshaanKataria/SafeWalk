from pydantic import BaseModel, Field


class RouteRequest(BaseModel):
    origin: str = Field(description="Starting location (address or place name)")
    destination: str = Field(description="Ending location (address or place name)")
    time_of_day: int = Field(ge=0, le=23, description="Hour of day (0-23)")


class LatLng(BaseModel):
    lat: float
    lng: float


class ScoredSegment(BaseModel):
    start: LatLng
    end: LatLng
    safety_score: int = Field(ge=0, le=100)
    color: str = Field(description="green | yellow | red")


class ScoredRoute(BaseModel):
    summary: str
    distance_km: float
    duration_min: int
    overall_score: int = Field(ge=0, le=100)
    segments: list[ScoredSegment]


class RouteResponse(BaseModel):
    routes: list[ScoredRoute]
