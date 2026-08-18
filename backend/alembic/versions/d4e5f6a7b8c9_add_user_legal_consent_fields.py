"""add_user_legal_consent_fields

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-05-21 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('terms_accepted_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        'users',
        sa.Column('privacy_accepted_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column('users', sa.Column('age_confirmed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('legal_consent_version', sa.String(length=32), nullable=True))
    op.add_column(
        'users',
        sa.Column('marketing_opt_in', sa.Boolean(), server_default=sa.false(), nullable=False),
    )
    op.add_column(
        'users',
        sa.Column('marketing_opt_in_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('users', 'marketing_opt_in_at')
    op.drop_column('users', 'marketing_opt_in')
    op.drop_column('users', 'legal_consent_version')
    op.drop_column('users', 'age_confirmed_at')
    op.drop_column('users', 'privacy_accepted_at')
    op.drop_column('users', 'terms_accepted_at')
