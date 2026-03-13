"""shared benchmark analytics pre-aggregate tables

Revision ID: 047_shared_benchmark_analytics
Revises: 046_rename_verified_to_listed
Create Date: 2026-03-13
"""
from alembic import op
import sqlalchemy as sa

revision = '047_shared_benchmark_analytics'
down_revision = '046_rename_verified_to_listed'
branch_labels = None
depends_on = None


def create_indexes(table: str, cols: list[str]):
    for col in cols:
        op.create_index(f"ix_{table}_{col}", table, [col])


def drop_indexes(table: str, cols: list[str]):
    for col in cols:
        op.drop_index(f"ix_{table}_{col}", table_name=table)


def upgrade() -> None:
    op.create_table(
        'benchmark_cohort_outcome_agg',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('institution_id', sa.String(), nullable=True),
        sa.Column('program_id', sa.String(), nullable=True),
        sa.Column('batch_id', sa.String(), nullable=True),
        sa.Column('month_bucket', sa.String(), nullable=False),
        sa.Column('outcome_type', sa.String(), nullable=False),
        sa.Column('outcome_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('avg_ctc', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['batch_id'], ['batches.id']),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id']),
        sa.ForeignKeyConstraint(['program_id'], ['programs.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    create_indexes('benchmark_cohort_outcome_agg', ['institution_id', 'program_id', 'batch_id', 'month_bucket', 'outcome_type'])

    op.create_table(
        'benchmark_role_progression_agg',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('institution_id', sa.String(), nullable=True),
        sa.Column('program_id', sa.String(), nullable=True),
        sa.Column('batch_id', sa.String(), nullable=True),
        sa.Column('graduation_year', sa.Integer(), nullable=True),
        sa.Column('role_name', sa.String(), nullable=False),
        sa.Column('trajectory_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('avg_ctc', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['batch_id'], ['batches.id']),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id']),
        sa.ForeignKeyConstraint(['program_id'], ['programs.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    create_indexes('benchmark_role_progression_agg', ['institution_id', 'program_id', 'batch_id', 'graduation_year', 'role_name'])

    op.create_table(
        'benchmark_transition_agg',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('institution_id', sa.String(), nullable=True),
        sa.Column('program_id', sa.String(), nullable=True),
        sa.Column('batch_id', sa.String(), nullable=True),
        sa.Column('from_company_id', sa.String(), nullable=True),
        sa.Column('to_company_id', sa.String(), nullable=True),
        sa.Column('from_business_unit_id', sa.String(), nullable=True),
        sa.Column('to_business_unit_id', sa.String(), nullable=True),
        sa.Column('from_designation_id', sa.String(), nullable=True),
        sa.Column('to_designation_id', sa.String(), nullable=True),
        sa.Column('from_role_name', sa.String(), nullable=True),
        sa.Column('to_role_name', sa.String(), nullable=True),
        sa.Column('transition_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['batch_id'], ['batches.id']),
        sa.ForeignKeyConstraint(['from_business_unit_id'], ['business_units.id']),
        sa.ForeignKeyConstraint(['to_business_unit_id'], ['business_units.id']),
        sa.ForeignKeyConstraint(['from_company_id'], ['companies.id']),
        sa.ForeignKeyConstraint(['to_company_id'], ['companies.id']),
        sa.ForeignKeyConstraint(['from_designation_id'], ['company_designations.id']),
        sa.ForeignKeyConstraint(['to_designation_id'], ['company_designations.id']),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id']),
        sa.ForeignKeyConstraint(['program_id'], ['programs.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    create_indexes(
        'benchmark_transition_agg',
        ['institution_id', 'program_id', 'batch_id', 'from_company_id', 'to_company_id', 'from_business_unit_id', 'to_business_unit_id', 'from_designation_id', 'to_designation_id'],
    )


def downgrade() -> None:
    drop_indexes('benchmark_transition_agg', ['institution_id', 'program_id', 'batch_id', 'from_company_id', 'to_company_id', 'from_business_unit_id', 'to_business_unit_id', 'from_designation_id', 'to_designation_id'])
    op.drop_table('benchmark_transition_agg')

    drop_indexes('benchmark_role_progression_agg', ['institution_id', 'program_id', 'batch_id', 'graduation_year', 'role_name'])
    op.drop_table('benchmark_role_progression_agg')

    drop_indexes('benchmark_cohort_outcome_agg', ['institution_id', 'program_id', 'batch_id', 'month_bucket', 'outcome_type'])
    op.drop_table('benchmark_cohort_outcome_agg')
