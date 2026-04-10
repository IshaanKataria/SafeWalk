import uuid

from geoalchemy2 import Geometry
from sqlalchemy import Column, DateTime, Integer, func
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class CachedScore(Base):
    __tablename__ = "cached_scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    location = Column(Geometry("POINT", srid=4326), nullable=False, index=True)
    time_of_day = Column(Integer, nullable=False)
    safety_score = Column(Integer, nullable=False)
    computed_at = Column(DateTime(timezone=True), server_default=func.now())
