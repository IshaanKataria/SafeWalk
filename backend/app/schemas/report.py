from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


VALID_CATEGORIES = ("lighting", "crime", "harassment", "other")


class CommunityReportCreate(BaseModel):
    lat: float = Field(description="Latitude")
    lng: float = Field(description="Longitude")
    category: str = Field(description="lighting | crime | harassment | other")
    description: str | None = Field(default=None, max_length=500)


class CommunityReportRead(BaseModel):
    id: UUID
    lat: float
    lng: float
    category: str
    description: str | None
    created_at: datetime
