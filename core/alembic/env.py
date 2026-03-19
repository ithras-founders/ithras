from logging.config import fileConfig
from sqlalchemy import pool
from alembic import context
import os

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Path setup for shared package
import sys
_env_dir = os.path.dirname(os.path.abspath(__file__))
# alembic/ -> core/ -> workspace_root
_core_dir = os.path.dirname(_env_dir)
_ws = os.path.dirname(_core_dir)
if _ws not in sys.path:
    sys.path.insert(0, _ws)
if os.path.exists("/shared") and "/" not in sys.path:
    sys.path.insert(0, "/")

# Ithras models
from shared.database.database import Base
target_metadata = Base.metadata

database_url = os.getenv("DATABASE_URL", "").strip()
if database_url:
    config.set_main_option("sqlalchemy.url", database_url.replace("%", "%%"))


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    from sqlalchemy import create_engine
    url = database_url or config.get_main_option("sqlalchemy.url", "")
    connectable = create_engine(url, poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
