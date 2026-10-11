"""Add canonical analyses and preserve historical rows. Frozen schema revision."""

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

revision = "001_analysis_records"
down_revision = None
branch_labels = depends_on = None


def upgrade():
    conn = op.get_bind()
    conn.execute(sa.text("CREATE EXTENSION IF NOT EXISTS vector"))
    tables = sa.inspect(conn).get_table_names()
    if "images" not in tables:
        op.create_table(
            "images",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("filename", sa.String, nullable=False),
            sa.Column("file_path", sa.String, nullable=False),
            sa.Column("embedding", Vector(768)),
            sa.Column("uploaded_at", sa.DateTime(timezone=True)),
        )
    if "risk_scores" not in tables:
        op.create_table(
            "risk_scores",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column(
                "image_id", sa.Integer, sa.ForeignKey("images.id"), nullable=False
            ),
            sa.Column("score", sa.Float, nullable=False),
            sa.Column("risk_level", sa.String),
            sa.Column("risk_type", sa.String),
            sa.Column("land_class", sa.String),
        )
    else:
        columns = {c["name"] for c in sa.inspect(conn).get_columns("risk_scores")}
        for name in ["risk_level", "risk_type", "land_class"]:
            if name not in columns:
                op.add_column("risk_scores", sa.Column(name, sa.String, nullable=True))
    if "ix_risk_scores_image_id" not in {
        i["name"] for i in sa.inspect(conn).get_indexes("risk_scores")
    }:
        op.create_index("ix_risk_scores_image_id", "risk_scores", ["image_id"])
    if "analyses" not in tables:
        op.create_table(
            "analyses",
            sa.Column("id", sa.String, primary_key=True),
            sa.Column(
                "image_id",
                sa.Integer,
                sa.ForeignKey("images.id"),
                unique=True,
                nullable=False,
            ),
            sa.Column("task_id", sa.String, unique=True, nullable=False),
            sa.Column("status", sa.String, nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("started_at", sa.DateTime(timezone=True)),
            sa.Column("completed_at", sa.DateTime(timezone=True)),
            sa.Column("land_class", sa.String),
            sa.Column("risk_level", sa.String),
            sa.Column("risk_type", sa.String),
            sa.Column("score", sa.Float),
            sa.Column("description", sa.String),
            sa.Column("model_votes", sa.JSON),
            sa.Column("model_agreement", sa.Integer),
            sa.Column("narrative", sa.String),
            sa.Column("narrative_source", sa.String),
            sa.Column("narrative_reason", sa.String),
            sa.Column("failure_reason", sa.String),
            sa.Column("model_version", sa.String),
            sa.CheckConstraint(
                "status IN ('queued','running','completed','inconclusive','failed')",
                name="analysis_status",
            ),
            sa.CheckConstraint(
                "score IS NULL OR (score >= 0 AND score <= 100)",
                name="analysis_score_range",
            ),
        )
        op.create_index("ix_analyses_completed_at", "analyses", ["completed_at"])


def downgrade():
    # Retain data-bearing tables on rollback. Older application versions ignore them.
    pass
