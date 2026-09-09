"""add email_verified to users

Revision ID: 78435615c50a
Revises: c5f62faf5a7e
Create Date: 2026-09-09 14:57:32.447156

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '78435615c50a'
down_revision: Union[str, None] = 'c5f62faf5a7e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('email_verified', sa.Boolean(), nullable=False, server_default='false'),
    )
    # Existing accounts predate this check. OTP-only accounts (no password) were
    # never at risk of pre-hijacking, and existing password accounts already
    # completed a real login — backfill both as verified so this migration
    # cannot lock anyone out of their current account.
    op.execute("UPDATE users SET email_verified = true")


def downgrade() -> None:
    op.drop_column('users', 'email_verified')
