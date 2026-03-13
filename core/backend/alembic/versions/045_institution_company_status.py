"""Add status column (PENDING | VERIFIED | PARTNER) to institutions and companies.

Three-tier model: PENDING (new, needs approval), VERIFIED (full details, no recruitment),
PARTNER (runs recruitment through platform). Existing rows backfilled to PARTNER.
"""
from alembic import op
import sqlalchemy as sa

revision = "045"
down_revision = "044"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    # Institutions: add status column
    if "institutions" in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("institutions")]
        if "status" not in cols:
            op.add_column(
                "institutions",
                sa.Column("status", sa.String(), nullable=True),
            )
            conn.execute(
                sa.text("UPDATE institutions SET status = 'PARTNER' WHERE status IS NULL")
            )
            op.alter_column(
                "institutions",
                "status",
                existing_type=sa.String(),
                nullable=False,
                server_default="PENDING",
            )

    # Companies: add status column
    if "companies" in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("companies")]
        if "status" not in cols:
            op.add_column(
                "companies",
                sa.Column("status", sa.String(), nullable=True),
            )
            conn.execute(
                sa.text("UPDATE companies SET status = 'PARTNER' WHERE status IS NULL")
            )
            op.alter_column(
                "companies",
                "status",
                existing_type=sa.String(),
                nullable=False,
                server_default="PENDING",
            )


def downgrade():
    op.drop_column("institutions", "status")
    op.drop_column("companies", "status")
