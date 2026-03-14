"""Add visibility column to prep_community_channels for feed channel management."""
from alembic import op
import sqlalchemy as sa

revision = "007_channel_visibility"
down_revision = "006_cat_prep"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if "prep_community_channels" in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("prep_community_channels")]
        if "visibility" not in cols:
            op.add_column(
                "prep_community_channels",
                sa.Column("visibility", sa.String(), nullable=False, server_default="public"),
            )


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if "prep_community_channels" in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("prep_community_channels")]
        if "visibility" in cols:
            op.drop_column("prep_community_channels", "visibility")
