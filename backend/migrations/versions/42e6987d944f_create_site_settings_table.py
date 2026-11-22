
"""create site settings table

Revision ID: 42e6987d944f
Revises: bdf4fe1be79a
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "42e6987d944f"
down_revision: Union[str, Sequence[str], None] = "bdf4fe1be79a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "site_settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("key", sa.String(length=100), nullable=False),
        sa.Column("value", sa.String(length=500), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    op.create_index(
        "ix_site_settings_key",
        "site_settings",
        ["key"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_site_settings_key", table_name="site_settings")
    op.drop_table("site_settings")
