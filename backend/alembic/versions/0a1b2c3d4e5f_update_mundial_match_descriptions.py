"""update_mundial_match_descriptions

Revision ID: 0a1b2c3d4e5f
Revises: f6a7b8c9d0e1
Create Date: 2026-05-24 10:00:00.000000

"""
import json
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = '0a1b2c3d4e5f'
down_revision: Union[str, None] = 'f6a7b8c9d0e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


ARGENTINA_SPAIN_TITLE = '¿Ganará Argentina a España en la fase de grupos?'
ARGENTINA_SPAIN_DESCRIPTION = (
    'El partido del Grupo A entre Argentina (campeona 2022) y España (campeona 2010). '
    'Se juega el 25 de junio en el Hard Rock Stadium de Miami.\n\n'
    'Dato estadístico: en Mundiales, el antecedente competitivo más citado entre ambos es '
    'Argentina 2-1 España en Inglaterra 1966. En amistosos recientes, España ganó 6-1 en '
    '2018 y Argentina ganó 4-1 en 2010, señal de un historial cruzado con partidos de alto '
    'margen.\n\n'
    'Este mercado se resolverá como SÍ si Argentina gana este partido (90 minutos).'
)
ARGENTINA_SPAIN_STATS_PATCH = json.dumps(
    {
        "dato_clave": (
            "Argentina ganó el único antecedente mundialista registrado en este mercado: "
            "2-1 vs España en 1966. En amistosos recientes hubo goleadas para ambos lados."
        ),
        "head_to_head": [
            {
                "fecha": "Jul 1966",
                "resultado": "Argentina 2-1 España",
                "tipo": "Mundial 1966 — Fase de grupos",
            },
            {"fecha": "Mar 2018", "resultado": "España 6-1 Argentina", "tipo": "Amistoso"},
            {"fecha": "Sep 2010", "resultado": "Argentina 4-1 España", "tipo": "Amistoso"},
        ],
        "balance_h2h": {"Argentina": 2, "España": 1},
    },
    ensure_ascii=False,
)

ARGENTINA_SAUDI_TITLE = (
    '¿Ganará Argentina su primer partido del Mundial 2026 vs Arabia Saudita?'
)
ARGENTINA_SAUDI_DESCRIPTION = (
    'El primer partido de Argentina es contra Arabia Saudita el 14 de junio en el SoFi Stadium '
    'de Los Ángeles. En Qatar 2022, Arabia Saudita ganó 2-1 en la mayor sorpresa del torneo.\n\n'
    'Dato estadístico: ese 2-1 fue el único cruce entre ambos en una Copa del Mundo y la única '
    'derrota argentina en Qatar 2022. Argentina ganó los seis partidos restantes del torneo '
    'hasta levantar la copa.\n\n'
    'Este mercado se resolverá como SÍ si Argentina gana el partido del 14 de junio (resultado '
    'a 90 minutos).'
)
ARGENTINA_SAUDI_STATS_PATCH = json.dumps(
    {
        "dato_clave": (
            "Arabia Saudita ganó el único antecedente mundialista entre ambos: 2-1 en "
            "Qatar 2022. Fue la única derrota argentina en ese torneo."
        )
    },
    ensure_ascii=False,
)


def _update_market(title: str, description: str, stats_patch: str) -> None:
    op.get_bind().execute(
        sa.text(
            """
            UPDATE markets
            SET description = :description,
                stats_data = COALESCE(stats_data, '{}'::jsonb) || CAST(:stats_patch AS jsonb)
            WHERE title = :title
            """
        ),
        {"title": title, "description": description, "stats_patch": stats_patch},
    )


def upgrade() -> None:
    _update_market(
        ARGENTINA_SPAIN_TITLE,
        ARGENTINA_SPAIN_DESCRIPTION,
        ARGENTINA_SPAIN_STATS_PATCH,
    )
    _update_market(
        ARGENTINA_SAUDI_TITLE,
        ARGENTINA_SAUDI_DESCRIPTION,
        ARGENTINA_SAUDI_STATS_PATCH,
    )


def downgrade() -> None:
    pass
