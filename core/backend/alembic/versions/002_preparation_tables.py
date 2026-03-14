"""Add preparation domain tables (B-school prep)."""
from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "prep_profiles" not in tables:
        op.create_table(
            "prep_profiles",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("cat_percentile", sa.Float(), nullable=True),
            sa.Column("grad_stream", sa.String(), nullable=True),
            sa.Column("work_ex_years", sa.Float(), nullable=True),
            sa.Column("achievements", sa.JSON(), nullable=False, server_default="[]"),
            sa.Column("extracurriculars", sa.JSON(), nullable=False, server_default="[]"),
            sa.Column("target_schools", sa.JSON(), nullable=False, server_default="[]"),
            sa.Column("baseline_metadata", sa.JSON(), nullable=False, server_default="{}"),
            sa.Column("admission_readiness_score", sa.Float(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        )
        op.create_index("ix_prep_profiles_user_id", "prep_profiles", ["user_id"], unique=True)

    if "prep_plans" not in tables:
        op.create_table(
            "prep_plans",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("profile_id", sa.String(), sa.ForeignKey("prep_profiles.id", ondelete="CASCADE"), nullable=False),
            sa.Column("weekly_goals", sa.JSON(), nullable=False, server_default="[]"),
            sa.Column("status", sa.String(), nullable=False, server_default="ACTIVE"),
            sa.Column("due_dates", sa.JSON(), nullable=False, server_default="{}"),
            sa.Column("week_start", sa.DateTime(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        )
        op.create_index("ix_prep_plans_profile_id", "prep_plans", ["profile_id"])

    if "prep_question_bank" not in tables:
        op.create_table(
            "prep_question_bank",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("category", sa.String(), nullable=False),
            sa.Column("school_tag", sa.String(), nullable=True),
            sa.Column("difficulty", sa.String(), nullable=True),
            sa.Column("source", sa.String(), nullable=True),
            sa.Column("question_text", sa.Text(), nullable=False),
            sa.Column("prompt_text", sa.Text(), nullable=True),
            sa.Column("extra_meta", sa.JSON(), nullable=False, server_default="{}"),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        )
        op.create_index("ix_prep_question_bank_category", "prep_question_bank", ["category"])
        op.create_index("ix_prep_question_bank_school_tag", "prep_question_bank", ["school_tag"])

    if "prep_attempts" not in tables:
        op.create_table(
            "prep_attempts",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("question_id", sa.String(), sa.ForeignKey("prep_question_bank.id", ondelete="SET NULL"), nullable=True),
            sa.Column("prompt_id", sa.String(), nullable=True),
            sa.Column("answer_text", sa.Text(), nullable=True),
            sa.Column("duration_sec", sa.Integer(), nullable=True),
            sa.Column("transcript_ref", sa.String(), nullable=True),
            sa.Column("attempt_type", sa.String(), nullable=False, server_default="TEXT"),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        )
        op.create_index("ix_prep_attempts_user_id", "prep_attempts", ["user_id"])
        op.create_index("ix_prep_attempts_question_id", "prep_attempts", ["question_id"])
        op.create_index("ix_prep_attempts_prompt_id", "prep_attempts", ["prompt_id"])

    if "prep_rubric_scores" not in tables:
        op.create_table(
            "prep_rubric_scores",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("attempt_id", sa.String(), sa.ForeignKey("prep_attempts.id", ondelete="CASCADE"), nullable=False),
            sa.Column("clarity", sa.Float(), nullable=True),
            sa.Column("structure", sa.Float(), nullable=True),
            sa.Column("relevance", sa.Float(), nullable=True),
            sa.Column("confidence", sa.Float(), nullable=True),
            sa.Column("aggregate_score", sa.Float(), nullable=False),
            sa.Column("dimensions", sa.JSON(), nullable=False, server_default="{}"),
            sa.Column("feedback_notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        )
        op.create_index("ix_prep_rubric_scores_attempt_id", "prep_rubric_scores", ["attempt_id"], unique=True)

    if "prep_milestones" not in tables:
        op.create_table(
            "prep_milestones",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("milestone_type", sa.String(), nullable=False),
            sa.Column("completed_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.Column("extra_meta", sa.JSON(), nullable=False, server_default="{}"),
        )
        op.create_index("ix_prep_milestones_user_id", "prep_milestones", ["user_id"])
        op.create_index("ix_prep_milestones_milestone_type", "prep_milestones", ["milestone_type"])

    if "prep_community_posts" not in tables:
        op.create_table(
            "prep_community_posts",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("channel", sa.String(), nullable=False),
            sa.Column("author_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("title", sa.String(), nullable=False),
            sa.Column("body", sa.Text(), nullable=False),
            sa.Column("tags", sa.JSON(), nullable=False, server_default="[]"),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        )
        op.create_index("ix_prep_community_posts_channel", "prep_community_posts", ["channel"])
        op.create_index("ix_prep_community_posts_author_id", "prep_community_posts", ["author_id"])

    if "prep_community_comments" not in tables:
        op.create_table(
            "prep_community_comments",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("post_id", sa.String(), sa.ForeignKey("prep_community_posts.id", ondelete="CASCADE"), nullable=False),
            sa.Column("author_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("body", sa.Text(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        )
        op.create_index("ix_prep_community_comments_post_id", "prep_community_comments", ["post_id"])
        op.create_index("ix_prep_community_comments_author_id", "prep_community_comments", ["author_id"])

    if "prep_peer_sessions" not in tables:
        op.create_table(
            "prep_peer_sessions",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("user_a", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("user_b", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("status", sa.String(), nullable=False, server_default="PENDING"),
            sa.Column("scheduled_at", sa.DateTime(), nullable=True),
            sa.Column("target_school", sa.String(), nullable=True),
            sa.Column("completed_at", sa.DateTime(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        )
        op.create_index("ix_prep_peer_sessions_user_a", "prep_peer_sessions", ["user_a"])
        op.create_index("ix_prep_peer_sessions_user_b", "prep_peer_sessions", ["user_b"])


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    drop_order = [
        "prep_peer_sessions",
        "prep_community_comments",
        "prep_community_posts",
        "prep_milestones",
        "prep_rubric_scores",
        "prep_attempts",
        "prep_question_bank",
        "prep_plans",
        "prep_profiles",
    ]
    for t in drop_order:
        if t in tables:
            op.drop_table(t)
