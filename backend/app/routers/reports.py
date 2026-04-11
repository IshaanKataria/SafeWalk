from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.community_report import CommunityReport
from app.schemas.report import (
    VALID_CATEGORIES,
    CommunityReportCreate,
    CommunityReportRead,
)

router = APIRouter(prefix="/api", tags=["reports"])


def _to_read(row: CommunityReport, lat: float, lng: float) -> CommunityReportRead:
    return CommunityReportRead(
        id=row.id,
        lat=lat,
        lng=lng,
        category=row.category,
        description=row.description,
        created_at=row.created_at,
    )


@router.post("/reports", response_model=CommunityReportRead, status_code=201)
def create_report(payload: CommunityReportCreate, db: Session = Depends(get_db)):
    if payload.category not in VALID_CATEGORIES:
        raise HTTPException(status_code=422, detail=f"category must be one of {VALID_CATEGORIES}")

    report = CommunityReport(
        location=func.ST_SetSRID(func.ST_MakePoint(payload.lng, payload.lat), 4326),
        description=payload.description,
        category=payload.category,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return _to_read(report, payload.lat, payload.lng)


@router.get("/reports", response_model=list[CommunityReportRead])
def list_reports(db: Session = Depends(get_db)):
    stmt = select(
        CommunityReport,
        func.ST_Y(CommunityReport.location).label("lat"),
        func.ST_X(CommunityReport.location).label("lng"),
    ).order_by(CommunityReport.created_at.desc())
    rows = db.execute(stmt).all()
    return [_to_read(row[0], row.lat, row.lng) for row in rows]


@router.get("/reports/nearby", response_model=list[CommunityReportRead])
def nearby_reports(lat: float, lng: float, radius_km: float = 0.5, db: Session = Depends(get_db)):
    # Use ST_Distance_Sphere for geographic-accurate distance in metres.
    # Simple and avoids GeoAlchemy2 Geography cast cache key issues.
    point_wkt = f"SRID=4326;POINT({lng} {lat})"
    stmt = (
        select(
            CommunityReport,
            func.ST_Y(CommunityReport.location).label("lat"),
            func.ST_X(CommunityReport.location).label("lng"),
        )
        .where(
            func.ST_DistanceSphere(CommunityReport.location, func.ST_GeomFromEWKT(point_wkt))
            <= radius_km * 1000
        )
        .order_by(CommunityReport.created_at.desc())
    )
    rows = db.execute(stmt).all()
    return [_to_read(row[0], row.lat, row.lng) for row in rows]
