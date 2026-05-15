"""add_mundial_category

Revision ID: a1b2c3d4e5f6
Revises: 92ea4bcafa83
Create Date: 2026-05-15 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '92ea4bcafa83'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE marketcategory ADD VALUE IF NOT EXISTS 'MUNDIAL'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values; handled manually if needed
    pass
