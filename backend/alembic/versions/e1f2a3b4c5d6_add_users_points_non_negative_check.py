"""add CHECK (points >= 0) on users (#276)

The balance check and the debit in prediction_service were two separate
statements with no row lock, so concurrent bets could both pass the check and
drive an account negative. The lock closes the race; this constraint is the
backstop for any future path that forgets to take it.

Existing negative balances are clamped to 0 first — they are the residue of the
race and of unresolve_market subtracting payouts the user no longer held, so
there is nothing to reconstruct from. The count is printed so the clamp is
visible in the migration log.

Revision ID: e1f2a3b4c5d6
Revises: d1e2f3a4b5c6
Create Date: 2026-09-17 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = 'e1f2a3b4c5d6'
down_revision: Union[str, None] = 'd1e2f3a4b5c6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    result = op.get_bind().execute(
        sa.text("UPDATE users SET points = 0 WHERE points < 0")
    )
    print(f"#276: clamped {result.rowcount} negative balance(s) to 0")

    op.create_check_constraint(
        "ck_users_points_non_negative", "users", sa.text("points >= 0")
    )


def downgrade() -> None:
    op.drop_constraint("ck_users_points_non_negative", "users", type_="check")
