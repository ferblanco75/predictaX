"""add football_fixtures table and fixture_id to markets

Revision ID: b9c0d1e2f3a4
Revises: a7b8c9d0e1f2
Create Date: 2026-06-09

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

from alembic import op

revision: str = 'b9c0d1e2f3a4'
down_revision: Union[str, None] = 'a7b8c9d0e1f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'football_fixtures',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('competition_code', sa.String(20), nullable=False, server_default='WC'),
        sa.Column('matchday', sa.Integer(), nullable=True),
        sa.Column('stage', sa.String(50), nullable=True),
        sa.Column('group', sa.String(20), nullable=True),
        sa.Column('home_team', sa.String(100), nullable=False),
        sa.Column('away_team', sa.String(100), nullable=False),
        sa.Column('home_team_crest', sa.String(500), nullable=True),
        sa.Column('away_team_crest', sa.String(500), nullable=True),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='TIMED'),
        sa.Column('home_score', sa.Integer(), nullable=True),
        sa.Column('away_score', sa.Integer(), nullable=True),
        sa.Column('winner', sa.String(10), nullable=True),
        sa.Column('venue', sa.String(200), nullable=True),
        sa.Column('raw_data', JSONB(), nullable=True),
        sa.Column('last_synced_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_football_fixtures_status', 'football_fixtures', ['status'])
    op.create_index('ix_football_fixtures_scheduled_at', 'football_fixtures', ['scheduled_at'])

    op.add_column('markets', sa.Column('fixture_id', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('markets', 'fixture_id')
    op.drop_index('ix_football_fixtures_scheduled_at', table_name='football_fixtures')
    op.drop_index('ix_football_fixtures_status', table_name='football_fixtures')
    op.drop_table('football_fixtures')
