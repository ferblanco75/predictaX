"""add otp_codes table

Revision ID: a7b8c9d0e1f2
Revises: 0a1b2c3d4e5f
Create Date: 2026-05-27

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'a7b8c9d0e1f2'
down_revision = '0a1b2c3d4e5f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'otp_codes',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('code', sa.String(6), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('used', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('attempts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_otp_codes_email', 'otp_codes', ['email'])


def downgrade() -> None:
    op.drop_index('ix_otp_codes_email', table_name='otp_codes')
    op.drop_table('otp_codes')
