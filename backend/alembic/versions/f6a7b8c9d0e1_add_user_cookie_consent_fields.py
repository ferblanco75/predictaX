"""add_user_cookie_consent_fields

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-05-21 14:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = 'f6a7b8c9d0e1'
down_revision: Union[str, None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column(
            'cookie_consent_analytics',
            sa.Boolean(),
            server_default=sa.false(),
            nullable=False,
        ),
    )
    op.add_column(
        'users',
        sa.Column(
            'cookie_consent_functional',
            sa.Boolean(),
            server_default=sa.false(),
            nullable=False,
        ),
    )
    op.add_column(
        'users',
        sa.Column(
            'cookie_consent_marketing',
            sa.Boolean(),
            server_default=sa.false(),
            nullable=False,
        ),
    )
    op.add_column('users', sa.Column('cookie_consent_version', sa.String(length=32), nullable=True))
    op.add_column(
        'users',
        sa.Column('cookie_consent_updated_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('users', 'cookie_consent_updated_at')
    op.drop_column('users', 'cookie_consent_version')
    op.drop_column('users', 'cookie_consent_marketing')
    op.drop_column('users', 'cookie_consent_functional')
    op.drop_column('users', 'cookie_consent_analytics')
