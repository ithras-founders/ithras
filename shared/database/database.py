from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

DATABASE_URL = settings.DATABASE_URL
if not DATABASE_URL or DATABASE_URL.strip() == "":
    if settings.IS_CLOUD_RUN:
        raise RuntimeError(
            "DATABASE_URL is not set. Configure it in Cloud Run service environment variables. "
            "See docs/CLOUD_RUN_DEPLOYMENT.md"
        )
    DATABASE_URL = "postgresql://ithras_user:ithras_password@db:5432/placement_db"
elif "@db:" in DATABASE_URL or "@db/" in DATABASE_URL:
    if settings.IS_CLOUD_RUN:
        raise RuntimeError(
            "DATABASE_URL uses host 'db' (Docker Compose) which does not resolve on Cloud Run. "
            "Set DATABASE_URL to your Cloud SQL or PostgreSQL connection string."
        )
SQLALCHEMY_DATABASE_URL = DATABASE_URL

_connect_args: dict = {}
if not (SQLALCHEMY_DATABASE_URL.startswith("postgresql://") and "host=/cloudsql/" in SQLALCHEMY_DATABASE_URL):
    _connect_args["connect_timeout"] = 10

# Cloud Run scales horizontally: each instance opens its own pool.
# Keep pool small to avoid exhausting Cloud SQL's connection limit.
# Default Cloud SQL Postgres limit is 100; at pool_size=5 you can run ~20 instances safely.
_pool_size = 5 if settings.IS_CLOUD_RUN else 20
_max_overflow = 2 if settings.IS_CLOUD_RUN else 10

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_size=_pool_size,
    max_overflow=_max_overflow,
    pool_pre_ping=True,
    pool_recycle=1800,
    connect_args=_connect_args,
    echo=settings.SQL_ECHO,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
