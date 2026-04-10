"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-04-11
"""

from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geometry

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.create_table(
        "community_reports",
        sa.Column("id", sa.UUID(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("location", Geometry("POINT", srid=4326), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(50), nullable=False, server_default="other"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_community_reports_location", "community_reports", ["location"], postgresql_using="gist")

    op.create_table(
        "cached_scores",
        sa.Column("id", sa.UUID(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("location", Geometry("POINT", srid=4326), nullable=False),
        sa.Column("time_of_day", sa.Integer(), nullable=False),
        sa.Column("safety_score", sa.Integer(), nullable=False),
        sa.Column("computed_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_cached_scores_location", "cached_scores", ["location"], postgresql_using="gist")


def downgrade() -> None:
    op.drop_table("cached_scores")
    op.drop_table("community_reports")
