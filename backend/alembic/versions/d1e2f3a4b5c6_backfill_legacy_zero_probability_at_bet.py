"""backfill legacy probability_at_bet = 0 on predictions (#275)

Until #275 the payout code read `probability_at_bet and probability_at_bet > 0`,
so a stored 0.0 was falsy and silently priced at 50 (a 2x payout). The first NO
bet on a fresh market leaves the market at exactly 0.00, so plenty of live
predictions carry that value.

Now that 0.0 is a meaningful probability (clamped to 1, a 100x payout), those
rows would suddenly be worth 50x more than what they were priced at when the
bet was placed. This rewrites them to the 50.0 they were effectively paid at,
so no already-contracted liability changes value, and leaves 0.0 free to mean
what it says for every bet placed from here on.

potential_gain is rewritten to match: at 50 the payout is 2x the stake, so the
net gain equals the stake (these rows stored 0.0, the old `prob > 0` branch).

Revision ID: d1e2f3a4b5c6
Revises: a1c2e3d4f5b6
Create Date: 2026-09-16 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = 'd1e2f3a4b5c6'
down_revision: Union[str, None] = 'a1c2e3d4f5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    result = op.get_bind().execute(
        sa.text(
            """
            UPDATE predictions
            SET probability_at_bet = 50.0,
                potential_gain = points_wagered
            WHERE probability_at_bet = 0.0
            """
        )
    )
    print(f"#275 backfill: repriced {result.rowcount} predictions with probability_at_bet = 0")


def downgrade() -> None:
    # Not reversible: a legacy 0.0 cannot be told apart from a legitimate 50.0.
    pass
