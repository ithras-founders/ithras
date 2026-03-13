"""Rename institution/company status VERIFIED to LISTED."""
from alembic import op


revision = "046"
down_revision = "045"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("UPDATE institutions SET status = 'LISTED' WHERE status = 'VERIFIED'")
    op.execute("UPDATE companies SET status = 'LISTED' WHERE status = 'VERIFIED'")


def downgrade():
    op.execute("UPDATE institutions SET status = 'VERIFIED' WHERE status = 'LISTED'")
    op.execute("UPDATE companies SET status = 'VERIFIED' WHERE status = 'LISTED'")
