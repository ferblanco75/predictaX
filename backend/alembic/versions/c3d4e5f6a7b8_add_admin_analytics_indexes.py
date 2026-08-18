"""add_admin_analytics_indexes

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-05-20 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        'ix_activity_log_action_created_at',
        'activity_log',
        ['action', 'created_at'],
        unique=False,
    )
    op.create_index(
        'ix_activity_log_endpoint_created_at',
        'activity_log',
        ['endpoint', 'created_at'],
        unique=False,
    )
    op.create_index(
        'ix_activity_log_status_code_created_at',
        'activity_log',
        ['status_code', 'created_at'],
        unique=False,
    )
    op.create_index(
        'ix_ai_usage_log_cache_hit_created_at',
        'ai_usage_log',
        ['cache_hit', 'created_at'],
        unique=False,
    )
    op.create_index(
        'ix_ai_usage_log_status_created_at',
        'ai_usage_log',
        ['status', 'created_at'],
        unique=False,
    )
    op.create_index(
        'ix_ai_usage_log_market_id_created_at',
        'ai_usage_log',
        ['market_id', 'created_at'],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index('ix_ai_usage_log_market_id_created_at', table_name='ai_usage_log')
    op.drop_index('ix_ai_usage_log_status_created_at', table_name='ai_usage_log')
    op.drop_index('ix_ai_usage_log_cache_hit_created_at', table_name='ai_usage_log')
    op.drop_index('ix_activity_log_status_code_created_at', table_name='activity_log')
    op.drop_index('ix_activity_log_endpoint_created_at', table_name='activity_log')
    op.drop_index('ix_activity_log_action_created_at', table_name='activity_log')
