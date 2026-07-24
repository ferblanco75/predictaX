"""add probability_at_bet to predictions

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
Create Date: 2026-05-29

"""
from alembic import op
import sqlalchemy as sa

revision = 'b8c9d0e1f2a3'
down_revision = 'a7b8c9d0e1f2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('predictions',
        sa.Column('probability_at_bet', sa.Float(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('predictions', 'probability_at_bet')
