"""Add prep_communities, prep_community_channels, prep_community_members, prep_channel_members. Seed MBA Preparation community and 6 channels."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None

MBA_PREP_ID = "comm_mba_prep"
CHANNELS = [
    ("ch_cat_strategy", "CAT_STRATEGY", "CAT Strategy", "CAT prep and percentile strategy", 1),
    ("ch_school_pi_iima", "SCHOOL_PI_IIMA", "IIM Ahmedabad PI", "IIMA interview questions and prep", 2),
    ("ch_school_pi_iimb", "SCHOOL_PI_IIMB", "IIM Bangalore PI", "IIMB interview questions and prep", 3),
    ("ch_school_pi_xlri", "SCHOOL_PI_XLRI", "XLRI PI", "XLRI interview questions and prep", 4),
    ("ch_wat_review", "WAT_REVIEW", "WAT Review", "Written Ability Test topics and feedback", 5),
    ("ch_gd_review", "GD_REVIEW", "GD Review", "Group Discussion prompts and structure", 6),
]


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "prep_communities" not in tables:
        op.create_table(
            "prep_communities",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("code", sa.String(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("cover_image_url", sa.String(), nullable=True),
            sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        )
        op.create_index("ix_prep_communities_code", "prep_communities", ["code"], unique=True)

    if "prep_community_channels" not in tables:
        op.create_table(
            "prep_community_channels",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("community_id", sa.String(), sa.ForeignKey("prep_communities.id", ondelete="CASCADE"), nullable=False),
            sa.Column("code", sa.String(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("image_url", sa.String(), nullable=True),
            sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        )
        op.create_index("ix_prep_community_channels_community_id", "prep_community_channels", ["community_id"])
        op.create_index("ix_prep_community_channels_code", "prep_community_channels", ["code"], unique=True)

    if "prep_community_members" not in tables:
        op.create_table(
            "prep_community_members",
            sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
            sa.Column("community_id", sa.String(), sa.ForeignKey("prep_communities.id", ondelete="CASCADE"), primary_key=True),
            sa.Column("joined_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        )

    if "prep_channel_members" not in tables:
        op.create_table(
            "prep_channel_members",
            sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
            sa.Column("channel_id", sa.String(), sa.ForeignKey("prep_community_channels.id", ondelete="CASCADE"), primary_key=True),
            sa.Column("joined_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        )

    # Seed MBA Preparation community
    existing = conn.execute(text("SELECT 1 FROM prep_communities WHERE id = :id"), {"id": MBA_PREP_ID}).fetchone()
    if not existing:
        conn.execute(
            text(
                "INSERT INTO prep_communities (id, code, name, description, cover_image_url, sort_order) "
                "VALUES (:id, 'MBA_PREP', 'MBA Preparation', 'CAT, PI, WAT, and GD prep discussions for B-school aspirants', NULL, 0)"
            ),
            {"id": MBA_PREP_ID},
        )

    # Seed 6 channels
    for ch_id, code, name, desc, sort_order in CHANNELS:
        existing_ch = conn.execute(text("SELECT 1 FROM prep_community_channels WHERE id = :id"), {"id": ch_id}).fetchone()
        if not existing_ch:
            conn.execute(
                text(
                    "INSERT INTO prep_community_channels (id, community_id, code, name, description, image_url, sort_order) "
                    "VALUES (:id, :comm_id, :code, :name, :desc, NULL, :sort)"
                ),
                {"id": ch_id, "comm_id": MBA_PREP_ID, "code": code, "name": name, "desc": desc, "sort": sort_order},
            )


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    for t in ["prep_channel_members", "prep_community_members", "prep_community_channels", "prep_communities"]:
        if t in tables:
            op.drop_table(t)
