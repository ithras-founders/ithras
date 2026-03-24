"""Merge migration history: 016_post_polls and 018_longform_system.

Revision ID: 019_merge_post_polls_longform
Revises: 018_longform_system, 016_post_polls
Create Date: 2025-03-21

Both branches stem from 015_telemetry_backfill; this merge restores a single head
so `alembic upgrade head` works.
"""

revision = "019_merge_post_polls_longform"
down_revision = ("018_longform_system", "016_post_polls")
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
