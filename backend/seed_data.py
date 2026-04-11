"""Seed a handful of community reports around Wandsworth for demo content.

Idempotent: checks for a sentinel report before inserting so re-running
the script won't create duplicates.

Usage (from backend/ with venv activated):
    python seed_data.py
"""

from sqlalchemy import func, select

from app.database import SessionLocal
from app.models.community_report import CommunityReport

SENTINEL_DESCRIPTION = "[seed] broken lamps along underpass"

DEMO_REPORTS: list[dict] = [
    {
        "lat": 51.5790,
        "lng": -0.2200,
        "category": "lighting",
        "description": SENTINEL_DESCRIPTION,
    },
    {
        "lat": 51.5740,
        "lng": -0.1960,
        "category": "harassment",
        "description": "[seed] group loitering near the station late at night",
    },
    {
        "lat": 51.5810,
        "lng": -0.2050,
        "category": "crime",
        "description": "[seed] bag snatched from pedestrian last week",
    },
    {
        "lat": 51.5850,
        "lng": -0.2150,
        "category": "lighting",
        "description": "[seed] dim streetlights along park edge",
    },
    {
        "lat": 51.5775,
        "lng": -0.2010,
        "category": "other",
        "description": "[seed] damaged pavement, tripping hazard at night",
    },
]


def main() -> None:
    db = SessionLocal()
    try:
        existing = db.execute(
            select(CommunityReport).where(CommunityReport.description == SENTINEL_DESCRIPTION)
        ).first()

        if existing:
            print("Seed data already present — skipping")
            return

        for r in DEMO_REPORTS:
            report = CommunityReport(
                location=func.ST_SetSRID(func.ST_MakePoint(r["lng"], r["lat"]), 4326),
                description=r["description"],
                category=r["category"],
            )
            db.add(report)

        db.commit()
        print(f"Inserted {len(DEMO_REPORTS)} demo reports")
    finally:
        db.close()


if __name__ == "__main__":
    main()
