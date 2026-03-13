from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

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

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=3600,
    connect_args={"connect_timeout": 10},
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