"""Initial schema - all tables from ORM models.

Revision ID: 001
Revises:
Create Date: 2025-02-27

"""
from alembic import op

# revision identifiers
revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create all tables from ORM metadata."""
    from app.modules.shared.database import Base
    from app.modules.shared import models  # noqa: F401

    conn = op.get_bind()
    Base.metadata.create_all(bind=conn)


def downgrade() -> None:
    """Drop all tables."""
    from app.modules.shared.database import Base
    from app.modules.shared import models  # noqa: F401

    conn = op.get_bind()
    Base.metadata.drop_all(bind=conn)
