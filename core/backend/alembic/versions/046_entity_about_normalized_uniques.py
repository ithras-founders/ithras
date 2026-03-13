"""Add normalized_name columns and scoped unique constraints for entity-about models."""

from alembic import op
import sqlalchemy as sa

revision = "046"
down_revision = "045"
branch_labels = None
depends_on = None


def _normalize_sql(column_name: str) -> str:
    return f"lower(regexp_replace(trim(coalesce({column_name}, '')), '\\s+', ' ', 'g'))"


def _add_normalized_name_column_if_missing(inspector, table_name: str):
    columns = {c["name"] for c in inspector.get_columns(table_name)}
    if "normalized_name" not in columns:
        op.add_column(table_name, sa.Column("normalized_name", sa.String(), nullable=True))


def _create_unique_if_missing(inspector, table_name: str, constraint_name: str, columns):
    existing = {uc["name"] for uc in inspector.get_unique_constraints(table_name) if uc.get("name")}
    if constraint_name not in existing:
        op.create_unique_constraint(constraint_name, table_name, columns)


def _create_index_if_missing(inspector, table_name: str, index_name: str, columns):
    existing = {idx["name"] for idx in inspector.get_indexes(table_name) if idx.get("name")}
    if index_name not in existing:
        op.create_index(index_name, table_name, columns, unique=False)


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    tables = [
        ("programs", "institution_id", "uq_programs_institution_normalized_name", "ix_programs_institution_normalized_name"),
        ("institution_degrees", "institution_id", "uq_institution_degrees_institution_normalized_name", "ix_institution_degrees_institution_normalized_name"),
        ("institution_certifications", "institution_id", "uq_institution_certifications_institution_normalized_name", "ix_institution_certifications_institution_normalized_name"),
        ("business_units", "company_id", "uq_business_units_company_normalized_name", "ix_business_units_company_normalized_name"),
        ("company_functions", "company_id", "uq_company_functions_company_normalized_name", "ix_company_functions_company_normalized_name"),
        ("company_designations", "company_id", "uq_company_designations_company_normalized_name", "ix_company_designations_company_normalized_name"),
    ]

    for table_name, scope_column, uq_name, ix_name in tables:
        if table_name not in inspector.get_table_names():
            continue
        _add_normalized_name_column_if_missing(inspector, table_name)
        conn.execute(sa.text(f"""
            UPDATE {table_name}
            SET normalized_name = {_normalize_sql('name')}
            WHERE normalized_name IS NULL
        """))
        op.alter_column(table_name, "normalized_name", existing_type=sa.String(), nullable=False)
        _create_unique_if_missing(inspector, table_name, uq_name, [scope_column, "normalized_name"])
        _create_index_if_missing(inspector, table_name, ix_name, [scope_column, "normalized_name"])


def downgrade():
    tables = [
        ("programs", "uq_programs_institution_normalized_name", "ix_programs_institution_normalized_name"),
        ("institution_degrees", "uq_institution_degrees_institution_normalized_name", "ix_institution_degrees_institution_normalized_name"),
        ("institution_certifications", "uq_institution_certifications_institution_normalized_name", "ix_institution_certifications_institution_normalized_name"),
        ("business_units", "uq_business_units_company_normalized_name", "ix_business_units_company_normalized_name"),
        ("company_functions", "uq_company_functions_company_normalized_name", "ix_company_functions_company_normalized_name"),
        ("company_designations", "uq_company_designations_company_normalized_name", "ix_company_designations_company_normalized_name"),
    ]

    conn = op.get_bind()
    inspector = sa.inspect(conn)

    for table_name, uq_name, ix_name in tables:
        if table_name not in inspector.get_table_names():
            continue
        indexes = {idx["name"] for idx in inspector.get_indexes(table_name) if idx.get("name")}
        uniques = {uc["name"] for uc in inspector.get_unique_constraints(table_name) if uc.get("name")}
        columns = {c["name"] for c in inspector.get_columns(table_name)}

        if ix_name in indexes:
            op.drop_index(ix_name, table_name=table_name)
        if uq_name in uniques:
            op.drop_constraint(uq_name, table_name, type_="unique")
        if "normalized_name" in columns:
            op.drop_column(table_name, "normalized_name")
