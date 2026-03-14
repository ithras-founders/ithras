"""Add CAT prep tables: cat_mock_sessions, cat_attempt_responses, cat_topic_scores."""
from alembic import op
import sqlalchemy as sa

revision = "006_cat_prep"
down_revision = "005_feed_post_type"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "cat_mock_sessions" not in tables:
        op.create_table(
            "cat_mock_sessions",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("session_type", sa.String(), nullable=False),
            sa.Column("difficulty_level", sa.String(), nullable=True),
            sa.Column("section_order", sa.JSON(), nullable=False, server_default="[]"),
            sa.Column("time_limit_sec", sa.Integer(), nullable=True),
            sa.Column("started_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.Column("submitted_at", sa.DateTime(), nullable=True),
            sa.Column("status", sa.String(), nullable=False, server_default="IN_PROGRESS"),
            sa.Column("score_raw", sa.JSON(), nullable=False, server_default="{}"),
            sa.Column("score_scaled", sa.JSON(), nullable=False, server_default="{}"),
            sa.Column("percentile_estimate", sa.JSON(), nullable=False, server_default="{}"),
            sa.Column("question_ids", sa.JSON(), nullable=False, server_default="[]"),
        )
        op.create_index("ix_cat_mock_sessions_user_id", "cat_mock_sessions", ["user_id"])
        op.create_index("ix_cat_mock_sessions_status", "cat_mock_sessions", ["status"])
        op.create_index("ix_cat_mock_sessions_started_at", "cat_mock_sessions", ["started_at"])

    if "cat_attempt_responses" not in tables:
        op.create_table(
            "cat_attempt_responses",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("session_id", sa.String(), sa.ForeignKey("cat_mock_sessions.id", ondelete="CASCADE"), nullable=False),
            sa.Column("question_id", sa.String(), sa.ForeignKey("prep_question_bank.id", ondelete="SET NULL"), nullable=True),
            sa.Column("selected_option", sa.String(), nullable=True),
            sa.Column("is_correct", sa.Boolean(), nullable=True),
            sa.Column("time_spent_sec", sa.Integer(), nullable=True),
            sa.Column("attempted_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        )
        op.create_index("ix_cat_attempt_responses_session_id", "cat_attempt_responses", ["session_id"])
        op.create_index("ix_cat_attempt_responses_question_id", "cat_attempt_responses", ["question_id"])

    if "cat_topic_scores" not in tables:
        op.create_table(
            "cat_topic_scores",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("section", sa.String(), nullable=False),
            sa.Column("topic", sa.String(), nullable=False),
            sa.Column("attempts_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("correct_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("accuracy_pct", sa.Float(), nullable=True),
            sa.Column("avg_time_sec", sa.Float(), nullable=True),
            sa.Column("last_attempted_at", sa.DateTime(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        )
        op.create_index("ix_cat_topic_scores_user_id", "cat_topic_scores", ["user_id"])
        op.create_index("uq_cat_topic_scores_user_section_topic", "cat_topic_scores", ["user_id", "section", "topic"], unique=True)


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    for t in ["cat_attempt_responses", "cat_topic_scores", "cat_mock_sessions"]:
        if t in tables:
            op.drop_table(t)
