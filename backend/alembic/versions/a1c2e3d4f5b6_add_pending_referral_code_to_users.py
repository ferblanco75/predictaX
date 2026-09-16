"""add pending_referral_code to users

Revision ID: a1c2e3d4f5b6
Revises: 78435615c50a
Create Date: 2026-09-16 10:12:44.118204

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1c2e3d4f5b6'
down_revision: Union[str, None] = '78435615c50a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # #280: the referral code submitted at registration is parked here and only
    # becomes a referrals row once the account passes OTP verification.
    op.add_column('users', sa.Column('pending_referral_code', sa.String(length=16), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'pending_referral_code')
