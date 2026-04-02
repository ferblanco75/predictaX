"""add_uuid_pks_avatar_url_and_prediction_fields

Revision ID: 4f361e107d91
Revises: b101fa28a04d
Create Date: 2026-04-02 02:34:42.134700

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '4f361e107d91'
down_revision: Union[str, None] = 'b101fa28a04d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop all tables in dependency order and recreate with UUID PKs.
    # Safe for development — no production data exists yet.

    op.drop_index(op.f('ix_predictions_id'), table_name='predictions')
    op.drop_table('predictions')

    op.drop_index(op.f('ix_market_snapshots_id'), table_name='market_snapshots')
    op.drop_index(op.f('ix_market_snapshots_timestamp'), table_name='market_snapshots')
    op.drop_table('market_snapshots')

    op.drop_index(op.f('ix_markets_id'), table_name='markets')
    op.drop_index(op.f('ix_markets_category'), table_name='markets')
    op.drop_index(op.f('ix_markets_status'), table_name='markets')
    op.drop_table('markets')

    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_table('users')

    # Drop enum types created by the initial migration
    op.execute('DROP TYPE IF EXISTS marketcategory')
    op.execute('DROP TYPE IF EXISTS marketstatus')
    op.execute('DROP TYPE IF EXISTS markettype')

    # Recreate enum types explicitly before tables that depend on them
    op.execute("CREATE TYPE marketcategory AS ENUM ('ECONOMIA', 'POLITICA', 'DEPORTES', 'TECNOLOGIA', 'CRYPTO')")
    op.execute("CREATE TYPE markettype AS ENUM ('BINARY', 'MULTIPLE_CHOICE', 'NUMERIC')")
    op.execute("CREATE TYPE marketstatus AS ENUM ('ACTIVE', 'RESOLVED', 'CANCELLED')")

    # Recreate users with UUID PK + new fields
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('username', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('avatar_url', sa.String(), nullable=True),
        sa.Column('points', sa.Float(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    # Recreate markets with UUID PK + resolved_at + created_by + DECIMAL probability
    op.create_table(
        'markets',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('category', sa.Enum('ECONOMIA', 'POLITICA', 'DEPORTES', 'TECNOLOGIA', 'CRYPTO', name='marketcategory', create_type=False), nullable=False),
        sa.Column('type', sa.Enum('BINARY', 'MULTIPLE_CHOICE', 'NUMERIC', name='markettype', create_type=False), nullable=True),
        sa.Column('probability_market', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('volume', sa.Float(), nullable=True),
        sa.Column('participants_count', sa.Integer(), nullable=True),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.Enum('ACTIVE', 'RESOLVED', 'CANCELLED', name='marketstatus', create_type=False), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolution_value', sa.Boolean(), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_markets_id'), 'markets', ['id'], unique=False)
    op.create_index(op.f('ix_markets_category'), 'markets', ['category'], unique=False)
    op.create_index(op.f('ix_markets_status'), 'markets', ['status'], unique=False)

    # Recreate market_snapshots with UUID PK + composite index
    op.create_table(
        'market_snapshots',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('market_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('probability', sa.Float(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['market_id'], ['markets.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_market_snapshots_id'), 'market_snapshots', ['id'], unique=False)
    op.create_index('ix_market_snapshots_market_id_timestamp', 'market_snapshots', ['market_id', 'timestamp'], unique=False)

    # Recreate predictions with UUID PK + potential_gain + status + indexes
    op.create_table(
        'predictions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('market_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('probability', sa.Float(), nullable=False),
        sa.Column('points_wagered', sa.Float(), nullable=False),
        sa.Column('potential_gain', sa.Float(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['market_id'], ['markets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_predictions_id'), 'predictions', ['id'], unique=False)
    op.create_index(op.f('ix_predictions_user_id'), 'predictions', ['user_id'], unique=False)
    op.create_index(op.f('ix_predictions_market_id'), 'predictions', ['market_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_predictions_market_id'), table_name='predictions')
    op.drop_index(op.f('ix_predictions_user_id'), table_name='predictions')
    op.drop_index(op.f('ix_predictions_id'), table_name='predictions')
    op.drop_table('predictions')

    op.drop_index('ix_market_snapshots_market_id_timestamp', table_name='market_snapshots')
    op.drop_index(op.f('ix_market_snapshots_id'), table_name='market_snapshots')
    op.drop_table('market_snapshots')

    op.drop_index(op.f('ix_markets_status'), table_name='markets')
    op.drop_index(op.f('ix_markets_category'), table_name='markets')
    op.drop_index(op.f('ix_markets_id'), table_name='markets')
    op.drop_table('markets')

    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_table('users')

    op.execute('DROP TYPE IF EXISTS marketcategory')
    op.execute('DROP TYPE IF EXISTS marketstatus')
    op.execute('DROP TYPE IF EXISTS markettype')

    # Recreate enum types explicitly before tables that depend on them
    op.execute("CREATE TYPE marketcategory AS ENUM ('ECONOMIA', 'POLITICA', 'DEPORTES', 'TECNOLOGIA', 'CRYPTO')")
    op.execute("CREATE TYPE markettype AS ENUM ('BINARY', 'MULTIPLE_CHOICE', 'NUMERIC')")
    op.execute("CREATE TYPE marketstatus AS ENUM ('ACTIVE', 'RESOLVED', 'CANCELLED')")

    # Recreate original integer-based schema
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('username', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('points', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    op.create_table(
        'markets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('category', sa.Enum('ECONOMIA', 'POLITICA', 'DEPORTES', 'TECNOLOGIA', 'CRYPTO', name='marketcategory', create_type=False), nullable=False),
        sa.Column('type', sa.Enum('BINARY', 'MULTIPLE_CHOICE', 'NUMERIC', name='markettype', create_type=False), nullable=True),
        sa.Column('probability_market', sa.Float(), nullable=True),
        sa.Column('volume', sa.Float(), nullable=True),
        sa.Column('participants_count', sa.Integer(), nullable=True),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.Enum('ACTIVE', 'RESOLVED', 'CANCELLED', name='marketstatus', create_type=False), nullable=True),
        sa.Column('resolution_value', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_markets_id'), 'markets', ['id'], unique=False)
    op.create_index(op.f('ix_markets_category'), 'markets', ['category'], unique=False)
    op.create_index(op.f('ix_markets_status'), 'markets', ['status'], unique=False)

    op.create_table(
        'market_snapshots',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('market_id', sa.Integer(), nullable=False),
        sa.Column('probability', sa.Float(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['market_id'], ['markets.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_market_snapshots_id'), 'market_snapshots', ['id'], unique=False)
    op.create_index(op.f('ix_market_snapshots_timestamp'), 'market_snapshots', ['timestamp'], unique=False)

    op.create_table(
        'predictions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('market_id', sa.Integer(), nullable=False),
        sa.Column('probability', sa.Float(), nullable=False),
        sa.Column('points_wagered', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['market_id'], ['markets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_predictions_id'), 'predictions', ['id'], unique=False)
