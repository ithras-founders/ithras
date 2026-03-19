"""Initial migration: users table with user_numerical PK

Revision ID: 001_initial
Revises: 
Create Date: 2025-03-13

"""
from alembic import op

revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE users (
            user_numerical SERIAL PRIMARY KEY,
            username VARCHAR(64) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            date_of_birth DATE NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE UNIQUE INDEX users_username_lower ON users (LOWER(username))")
    op.execute("CREATE UNIQUE INDEX users_email_lower ON users (LOWER(email))")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS users CASCADE")
