from pydantic import BaseModel, Field


class HeatmapPoint(BaseModel):
    lat: float
    lng: float
    score: int = Field(ge=0, le=100)


class HeatmapResponse(BaseModel):
    points: list[HeatmapPoint]
    time_of_day: int
    grid_spacing_m: int
