"""Preparation domain models: B-school prep (CAT, PI, WAT, GD) - profile, plans, attempts, community."""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text, Boolean
from sqlalchemy.orm import relationship
from ..database import Base
import datetime


class PrepProfile(Base):
    """User's preparation profile: CAT percentile, academics, target schools."""
    __tablename__ = "prep_profiles"
    __table_args__ = {"info": {"domain": "preparation"}}

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    cat_percentile = Column(Float, nullable=True)
    grad_stream = Column(String, nullable=True)  # e.g. Engineering, Commerce
    work_ex_years = Column(Float, nullable=True)
    achievements = Column(JSON, default=[])  # list of achievement strings
    extracurriculars = Column(JSON, default=[])  # list of activities
    target_schools = Column(JSON, default=[])  # e.g. ["IIMA", "IIMB", "XLRI"]
    baseline_metadata = Column(JSON, default={})  # readiness dimensions, etc.
    admission_readiness_score = Column(Float, nullable=True)  # 0-100
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])


class PrepPlan(Base):
    """Weekly preparation plan with goals and status."""
    __tablename__ = "prep_plans"
    __table_args__ = {"info": {"domain": "preparation"}}

    id = Column(String, primary_key=True)
    profile_id = Column(String, ForeignKey("prep_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    weekly_goals = Column(JSON, default=[])  # list of goal dicts
    status = Column(String, default="ACTIVE")  # ACTIVE, COMPLETED, PAUSED
    due_dates = Column(JSON, default={})  # goal_id -> due_date
    week_start = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    profile = relationship("PrepProfile", foreign_keys=[profile_id])


class PrepQuestionBank(Base):
    """Static question bank for PI, WAT, GD, CAT."""
    __tablename__ = "prep_question_bank"
    __table_args__ = {"info": {"domain": "preparation"}}

    id = Column(String, primary_key=True)
    category = Column(String, nullable=False, index=True)  # PI, WAT, GD, CAT
    school_tag = Column(String, nullable=True, index=True)  # IIMA, IIMB, XLRI, etc.
    difficulty = Column(String, nullable=True)  # EASY, MEDIUM, HARD
    source = Column(String, nullable=True)  # curated, user_submitted
    question_text = Column(Text, nullable=False)
    prompt_text = Column(Text, nullable=True)  # for WAT/GD topics
    extra_meta = Column(JSON, default={})  # tags, subcategory
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class PrepAttempt(Base):
    """User's attempt at a question (PI, WAT, GD)."""
    __tablename__ = "prep_attempts"
    __table_args__ = {"info": {"domain": "preparation"}}

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String, ForeignKey("prep_question_bank.id", ondelete="SET NULL"), nullable=True, index=True)
    prompt_id = Column(String, nullable=True, index=True)  # for WAT/GD prompts without question_id
    answer_text = Column(Text, nullable=True)
    duration_sec = Column(Integer, nullable=True)
    transcript_ref = Column(String, nullable=True)  # ref to voice transcript if applicable
    attempt_type = Column(String, nullable=False, default="TEXT")  # TEXT, VOICE
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
    question = relationship("PrepQuestionBank", foreign_keys=[question_id])


class PrepRubricScore(Base):
    """Deterministic rubric score for an attempt."""
    __tablename__ = "prep_rubric_scores"
    __table_args__ = {"info": {"domain": "preparation"}}

    id = Column(String, primary_key=True)
    attempt_id = Column(String, ForeignKey("prep_attempts.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    clarity = Column(Float, nullable=True)  # 0-10 or 0-100
    structure = Column(Float, nullable=True)
    relevance = Column(Float, nullable=True)
    confidence = Column(Float, nullable=True)
    aggregate_score = Column(Float, nullable=False)
    dimensions = Column(JSON, default={})  # flexible dimension scores
    feedback_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    attempt = relationship("PrepAttempt", foreign_keys=[attempt_id])


class PrepMilestone(Base):
    """Track user completion milestones (CV_COMPLETE, MOCK_1, etc.)."""
    __tablename__ = "prep_milestones"
    __table_args__ = {"info": {"domain": "preparation"}}

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    milestone_type = Column(String, nullable=False, index=True)  # CV_COMPLETE, MOCK_1, MOCK_5, WAT_1, etc.
    completed_at = Column(DateTime, default=datetime.datetime.utcnow)
    extra_meta = Column(JSON, default={})

    user = relationship("User", foreign_keys=[user_id])


class PrepCommunity(Base):
    """Community group containing channels (e.g. MBA Preparation)."""
    __tablename__ = "prep_communities"
    __table_args__ = {"info": {"domain": "preparation"}}

    id = Column(String, primary_key=True)
    code = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    cover_image_url = Column(String, nullable=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    channels = relationship("PrepCommunityChannel", back_populates="community", order_by="PrepCommunityChannel.sort_order")
    members = relationship("PrepCommunityMember", back_populates="community")


class PrepCommunityChannel(Base):
    """Channel within a community (e.g. CAT Strategy, IIMA PI)."""
    __tablename__ = "prep_community_channels"
    __table_args__ = {"info": {"domain": "preparation"}}

    id = Column(String, primary_key=True)
    community_id = Column(String, ForeignKey("prep_communities.id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    sort_order = Column(Integer, default=0)
    visibility = Column(String, default="public", nullable=False)  # public, private, restricted
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    community = relationship("PrepCommunity", back_populates="channels")
    members = relationship("PrepChannelMember", back_populates="channel")


class PrepCommunityMember(Base):
    """User membership in a community."""
    __tablename__ = "prep_community_members"
    __table_args__ = {"info": {"domain": "preparation"}}

    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    community_id = Column(String, ForeignKey("prep_communities.id", ondelete="CASCADE"), primary_key=True)
    joined_at = Column(DateTime, default=datetime.datetime.utcnow)

    community = relationship("PrepCommunity", back_populates="members")
    user = relationship("User", foreign_keys=[user_id])


class PrepChannelMember(Base):
    """User membership in a channel."""
    __tablename__ = "prep_channel_members"
    __table_args__ = {"info": {"domain": "preparation"}}

    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    channel_id = Column(String, ForeignKey("prep_community_channels.id", ondelete="CASCADE"), primary_key=True)
    joined_at = Column(DateTime, default=datetime.datetime.utcnow)

    channel = relationship("PrepCommunityChannel", back_populates="members")
    user = relationship("User", foreign_keys=[user_id])


class PrepCommunityPost(Base):
    """Structured forum post in preparation channels."""
    __tablename__ = "prep_community_posts"
    __table_args__ = {"info": {"domain": "preparation"}}

    id = Column(String, primary_key=True)
    channel = Column(String, nullable=False, index=True)  # CAT_STRATEGY, SCHOOL_PI_IIMA, WAT_REVIEW, etc.
    author_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    tags = Column(JSON, default=[])  # mandatory tags for filtering
    status = Column(String, default="ACTIVE", index=True)  # ACTIVE, HIDDEN, DELETED
    pinned_at = Column(DateTime, nullable=True)
    moderated_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    moderated_at = Column(DateTime, nullable=True)
    moderation_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    author = relationship("User", foreign_keys=[author_id])


class PrepCommunityComment(Base):
    """Thread reply on a community post."""
    __tablename__ = "prep_community_comments"
    __table_args__ = {"info": {"domain": "preparation"}}

    id = Column(String, primary_key=True)
    post_id = Column(String, ForeignKey("prep_community_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    body = Column(Text, nullable=False)
    status = Column(String, default="ACTIVE", index=True)  # ACTIVE, HIDDEN, DELETED
    moderated_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    moderated_at = Column(DateTime, nullable=True)
    moderation_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    post = relationship("PrepCommunityPost", foreign_keys=[post_id])
    author = relationship("User", foreign_keys=[author_id])


class PrepPeerSession(Base):
    """Mock partner pairing for peer mocks."""
    __tablename__ = "prep_peer_sessions"
    __table_args__ = {"info": {"domain": "preparation"}}

    id = Column(String, primary_key=True)
    user_a = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    user_b = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String, default="PENDING")  # PENDING, SCHEDULED, COMPLETED, CANCELLED
    scheduled_at = Column(DateTime, nullable=True)
    target_school = Column(String, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class CATMockSession(Base):
    """CAT mock test session (sectional or full)."""
    __tablename__ = "cat_mock_sessions"
    __table_args__ = {"info": {"domain": "preparation"}}

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_type = Column(String, nullable=False)
    difficulty_level = Column(String, nullable=True)
    section_order = Column(JSON, default=[])
    time_limit_sec = Column(Integer, nullable=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    submitted_at = Column(DateTime, nullable=True)
    status = Column(String, default="IN_PROGRESS")
    score_raw = Column(JSON, default={})
    score_scaled = Column(JSON, default={})
    percentile_estimate = Column(JSON, default={})
    question_ids = Column(JSON, default=[])

    user = relationship("User", foreign_keys=[user_id])
    responses = relationship("CATAttemptResponse", back_populates="session", cascade="all, delete-orphan")


class CATAttemptResponse(Base):
    """User's answer for a question in a CAT mock session."""
    __tablename__ = "cat_attempt_responses"
    __table_args__ = {"info": {"domain": "preparation"}}

    id = Column(String, primary_key=True)
    session_id = Column(String, ForeignKey("cat_mock_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String, ForeignKey("prep_question_bank.id", ondelete="SET NULL"), nullable=True, index=True)
    selected_option = Column(String, nullable=True)
    is_correct = Column(Boolean, nullable=True)
    time_spent_sec = Column(Integer, nullable=True)
    attempted_at = Column(DateTime, default=datetime.datetime.utcnow)

    session = relationship("CATMockSession", back_populates="responses")
    question = relationship("PrepQuestionBank", foreign_keys=[question_id])


class CATTopicScore(Base):
    """Aggregated topic-wise scores for a user."""
    __tablename__ = "cat_topic_scores"
    __table_args__ = {"info": {"domain": "preparation"}}

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    section = Column(String, nullable=False)
    topic = Column(String, nullable=False)
    attempts_count = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    accuracy_pct = Column(Float, nullable=True)
    avg_time_sec = Column(Float, nullable=True)
    last_attempted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
