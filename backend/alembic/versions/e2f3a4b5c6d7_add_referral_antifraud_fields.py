"""add referral antifraud fields

Revision ID: e2f3a4b5c6d7
Revises: d1e2f3a4b5c6
Create Date: 2026-09-17 09:41:12.884301

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e2f3a4b5c6d7'
down_revision: Union[str, None] = 'd1e2f3a4b5c6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # #282: signup IP feeds the per-IP referral cap; bonus_blocked_reason
    # records which cap withheld the bonuses, so farming is reviewable.
    op.add_column('referrals', sa.Column('signup_ip', sa.String(length=45), nullable=True))
    op.add_column(
        'referrals', sa.Column('bonus_blocked_reason', sa.String(length=32), nullable=True)
    )
    op.create_index('ix_referrals_signup_ip', 'referrals', ['signup_ip'])


def downgrade() -> None:
    op.drop_index('ix_referrals_signup_ip', table_name='referrals')
    op.drop_column('referrals', 'bonus_blocked_reason')
    op.drop_column('referrals', 'signup_ip')
