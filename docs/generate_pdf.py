#!/usr/bin/env python3
"""Generate PredictaX API documentation PDF."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, white, black, Color
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus.flowables import Flowable
from reportlab.lib import colors
from datetime import date

# ── Color palette ─────────────────────────────────────────────────────────────
C_DARK_BLUE   = HexColor('#1a365d')
C_MID_BLUE    = HexColor('#2b6cb0')
C_LIGHT_BLUE  = HexColor('#ebf8ff')
C_GREEN       = HexColor('#276749')
C_GREEN_BG    = HexColor('#f0fff4')
C_GREEN_TAG   = HexColor('#38a169')
C_ORANGE      = HexColor('#c05621')
C_ORANGE_BG   = HexColor('#fffaf0')
C_ORANGE_TAG  = HexColor('#dd6b20')
C_POST_BG     = HexColor('#ebf4ff')
C_POST_TAG    = HexColor('#3182ce')
C_GRAY_BG     = HexColor('#f7fafc')
C_GRAY_DARK   = HexColor('#4a5568')
C_GRAY_MED    = HexColor('#718096')
C_GRAY_LIGHT  = HexColor('#e2e8f0')
C_ROW_ALT     = HexColor('#f0f4f8')
C_ACCENT      = HexColor('#3182ce')
C_CODE_BG     = HexColor('#f5f5f5')
C_CODE_BORDER = HexColor('#d0d0d0')

PAGE_W, PAGE_H = A4
MARGIN = 2 * cm

# ── Styles ────────────────────────────────────────────────────────────────────
def build_styles():
    base = getSampleStyleSheet()

    styles = {
        'title': ParagraphStyle(
            'title',
            fontName='Helvetica-Bold',
            fontSize=32,
            textColor=white,
            alignment=TA_CENTER,
            spaceAfter=8,
        ),
        'subtitle': ParagraphStyle(
            'subtitle',
            fontName='Helvetica',
            fontSize=14,
            textColor=HexColor('#bee3f8'),
            alignment=TA_CENTER,
            spaceAfter=4,
        ),
        'date_style': ParagraphStyle(
            'date_style',
            fontName='Helvetica',
            fontSize=11,
            textColor=HexColor('#90cdf4'),
            alignment=TA_CENTER,
        ),
        'h1': ParagraphStyle(
            'h1',
            fontName='Helvetica-Bold',
            fontSize=14,
            textColor=white,
            spaceAfter=4,
            spaceBefore=0,
            leftIndent=0,
        ),
        'h2': ParagraphStyle(
            'h2',
            fontName='Helvetica-Bold',
            fontSize=12,
            textColor=C_DARK_BLUE,
            spaceBefore=14,
            spaceAfter=4,
        ),
        'h3': ParagraphStyle(
            'h3',
            fontName='Helvetica-Bold',
            fontSize=10,
            textColor=C_MID_BLUE,
            spaceBefore=10,
            spaceAfter=3,
        ),
        'body': ParagraphStyle(
            'body',
            fontName='Helvetica',
            fontSize=9,
            textColor=C_GRAY_DARK,
            spaceAfter=4,
            leading=14,
        ),
        'code': ParagraphStyle(
            'code',
            fontName='Courier',
            fontSize=8,
            textColor=HexColor('#2d3748'),
            spaceAfter=2,
            leading=12,
            leftIndent=8,
        ),
        'table_header': ParagraphStyle(
            'table_header',
            fontName='Helvetica-Bold',
            fontSize=8,
            textColor=white,
        ),
        'table_cell': ParagraphStyle(
            'table_cell',
            fontName='Helvetica',
            fontSize=8,
            textColor=C_GRAY_DARK,
            leading=11,
        ),
        'table_code': ParagraphStyle(
            'table_code',
            fontName='Courier',
            fontSize=7.5,
            textColor=HexColor('#2d3748'),
            leading=11,
        ),
        'label': ParagraphStyle(
            'label',
            fontName='Helvetica-Bold',
            fontSize=8,
            textColor=C_GRAY_DARK,
        ),
        'endpoint_path': ParagraphStyle(
            'endpoint_path',
            fontName='Courier-Bold',
            fontSize=10,
            textColor=C_DARK_BLUE,
            spaceBefore=2,
        ),
        'info_value': ParagraphStyle(
            'info_value',
            fontName='Courier',
            fontSize=8.5,
            textColor=C_MID_BLUE,
        ),
        'step_num': ParagraphStyle(
            'step_num',
            fontName='Helvetica-Bold',
            fontSize=9,
            textColor=white,
            alignment=TA_CENTER,
        ),
        'step_body': ParagraphStyle(
            'step_body',
            fontName='Helvetica',
            fontSize=8.5,
            textColor=C_GRAY_DARK,
            leading=13,
        ),
        'docker_cmd': ParagraphStyle(
            'docker_cmd',
            fontName='Courier',
            fontSize=8,
            textColor=HexColor('#2d3748'),
            leading=12,
            leftIndent=6,
        ),
    }
    return styles

S = build_styles()

# ── Helper flowables ──────────────────────────────────────────────────────────

def section_header(text):
    """Dark-blue banner with white text."""
    tbl = Table(
        [[Paragraph(text, S['h1'])]],
        colWidths=[PAGE_W - 2 * MARGIN],
        rowHeights=[22],
    )
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_DARK_BLUE),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [C_DARK_BLUE]),
    ]))
    return tbl


def sub_header(text):
    """Mid-blue accent line."""
    tbl = Table(
        [[Paragraph(text, ParagraphStyle('sh', fontName='Helvetica-Bold',
                                         fontSize=11, textColor=white))]],
        colWidths=[PAGE_W - 2 * MARGIN],
        rowHeights=[18],
    )
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_MID_BLUE),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    return tbl


def method_badge(method, path, auth=False):
    """Colored method + path + optional auth badge."""
    if method == 'GET':
        bg, fg = C_GREEN_TAG, white
    elif method == 'POST':
        bg, fg = C_POST_TAG, white
    else:
        bg, fg = C_ORANGE_TAG, white

    badge_style = ParagraphStyle('badge', fontName='Helvetica-Bold',
                                 fontSize=9, textColor=white)
    path_style  = ParagraphStyle('pathst', fontName='Courier-Bold',
                                 fontSize=9.5, textColor=C_DARK_BLUE)
    auth_style  = ParagraphStyle('authst', fontName='Helvetica',
                                 fontSize=8, textColor=C_ORANGE)

    row_data = [[
        Paragraph(method, badge_style),
        Paragraph(path, path_style),
        Paragraph('🔒 Auth requerida' if auth else '', auth_style),
    ]]
    col_w = [1.4 * cm, PAGE_W - 2 * MARGIN - 1.4 * cm - 3.0 * cm, 3.0 * cm]
    tbl = Table(row_data, colWidths=col_w, rowHeights=[20])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), bg),
        ('BACKGROUND', (1, 0), (2, 0), C_GRAY_BG),
        ('ALIGN', (0, 0), (0, 0), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (1, 0), (1, 0), 8),
        ('LEFTPADDING', (2, 0), (2, 0), 4),
        ('BOX', (0, 0), (-1, -1), 0.5, C_GRAY_LIGHT),
        ('LINEAFTER', (0, 0), (0, 0), 0.5, C_GRAY_LIGHT),
    ]))
    return tbl


def code_block(lines):
    """Light-gray box for JSON / code snippets."""
    content = '<br/>'.join(
        line.replace(' ', '&nbsp;').replace('<', '&lt;').replace('>', '&gt;')
        for line in lines
    )
    p = Paragraph(content, S['code'])
    tbl = Table([[p]], colWidths=[PAGE_W - 2 * MARGIN])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_CODE_BG),
        ('BOX', (0, 0), (-1, -1), 0.5, C_CODE_BORDER),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    return tbl


def kv_table(pairs):
    """Simple key-value info table."""
    data = []
    for k, v in pairs:
        data.append([
            Paragraph(k, S['label']),
            Paragraph(v, S['info_value']),
        ])
    tbl = Table(data, colWidths=[4 * cm, PAGE_W - 2 * MARGIN - 4 * cm])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), C_LIGHT_BLUE),
        ('BACKGROUND', (1, 0), (1, -1), white),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [C_LIGHT_BLUE, C_GRAY_BG]),
        ('BOX', (0, 0), (-1, -1), 0.5, C_GRAY_LIGHT),
        ('INNERGRID', (0, 0), (-1, -1), 0.3, C_GRAY_LIGHT),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    return tbl


def db_table(headers, rows, col_widths=None):
    """Styled database table with alternating rows."""
    avail = PAGE_W - 2 * MARGIN
    if col_widths is None:
        w = avail / len(headers)
        col_widths = [w] * len(headers)

    header_row = [Paragraph(h, S['table_header']) for h in headers]
    data = [header_row]
    for i, row in enumerate(rows):
        styled = []
        for j, cell in enumerate(row):
            st = S['table_code'] if j == 0 or j == 1 else S['table_cell']
            styled.append(Paragraph(str(cell), st))
        data.append(styled)

    tbl = Table(data, colWidths=col_widths)
    row_colors = []
    for i in range(1, len(data)):
        bg = white if i % 2 == 0 else C_ROW_ALT
        row_colors.append(('BACKGROUND', (0, i), (-1, i), bg))

    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_DARK_BLUE),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('BOX', (0, 0), (-1, -1), 0.5, C_GRAY_LIGHT),
        ('INNERGRID', (0, 0), (-1, -1), 0.3, C_GRAY_LIGHT),
        ('LEFTPADDING', (0, 0), (-1, -1), 7),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ] + row_colors))
    return tbl


# ── Page numbering ────────────────────────────────────────────────────────────
def add_page_number(canvas, doc):
    canvas.saveState()
    # Footer bar
    canvas.setFillColor(C_DARK_BLUE)
    canvas.rect(0, 0, PAGE_W, 1.1 * cm, fill=1, stroke=0)
    canvas.setFillColor(white)
    canvas.setFont('Helvetica', 8)
    canvas.drawCentredString(PAGE_W / 2, 0.4 * cm, f'PredictaX API — Página {doc.page}')
    canvas.drawString(MARGIN, 0.4 * cm, 'Confidencial — Uso interno')
    canvas.drawRightString(PAGE_W - MARGIN, 0.4 * cm, 'http://localhost:8000')
    # Top thin line
    canvas.setStrokeColor(C_ACCENT)
    canvas.setLineWidth(2)
    canvas.line(MARGIN, PAGE_H - 1.5 * cm, PAGE_W - MARGIN, PAGE_H - 1.5 * cm)
    canvas.restoreState()


# ── Title page ────────────────────────────────────────────────────────────────
def title_page():
    story = []

    # Big colored banner
    tbl = Table(
        [[
            Paragraph('PredictaX', S['title']),
        ]],
        colWidths=[PAGE_W - 2 * MARGIN],
        rowHeights=[80],
    )
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_DARK_BLUE),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(Spacer(1, 3 * cm))
    story.append(tbl)

    # Subtitle band
    tbl2 = Table(
        [[Paragraph('API — Documentación de Endpoints y Base de Datos', S['subtitle'])]],
        colWidths=[PAGE_W - 2 * MARGIN],
        rowHeights=[40],
    )
    tbl2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_MID_BLUE),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(tbl2)
    story.append(Spacer(1, 0.5 * cm))

    story.append(Paragraph(f'Generado el {date.today().strftime("%d de %B de %Y")}', S['date_style']))
    story.append(Spacer(1, 1.5 * cm))

    # Quick info card
    info = [
        ('Base URL', 'http://localhost:8000'),
        ('Swagger UI', 'http://localhost:8000/api/docs'),
        ('Formato', 'JSON'),
        ('Autenticación', 'Bearer JWT Token'),
        ('Expiración token', '30 minutos'),
    ]
    story.append(kv_table(info))
    story.append(PageBreak())
    return story


# ── Database section ──────────────────────────────────────────────────────────
def db_section():
    story = []
    story.append(section_header('Base de Datos PostgreSQL'))
    story.append(Spacer(1, 0.3 * cm))

    story.append(Paragraph('Conexión (desarrollo)', S['h2']))
    conn = [
        ('Host', 'localhost'),
        ('Port', '5433'),
        ('Database', 'predictax'),
        ('User', 'predictax'),
        ('Password', 'predictax_dev'),
        ('JDBC URL', 'jdbc:postgresql://localhost:5433/predictax'),
    ]
    story.append(kv_table(conn))
    story.append(Spacer(1, 0.5 * cm))

    # users table
    story.append(Paragraph('Tabla: users', S['h2']))
    story.append(db_table(
        ['Columna', 'Tipo', 'Descripción'],
        [
            ['id', 'INTEGER PK', 'Auto-incremental'],
            ['email', 'VARCHAR UNIQUE', 'Email del usuario'],
            ['username', 'VARCHAR UNIQUE', 'Nombre de usuario'],
            ['hashed_password', 'VARCHAR', 'Contraseña encriptada con bcrypt'],
            ['points', 'FLOAT', 'Puntos disponibles (default: 1000)'],
            ['created_at', 'TIMESTAMP', 'Fecha de creación'],
            ['updated_at', 'TIMESTAMP', 'Última actualización'],
        ],
        col_widths=[3.5 * cm, 4 * cm, PAGE_W - 2 * MARGIN - 7.5 * cm],
    ))
    story.append(Spacer(1, 0.5 * cm))

    # markets table
    story.append(Paragraph('Tabla: markets', S['h2']))
    story.append(db_table(
        ['Columna', 'Tipo', 'Descripción'],
        [
            ['id', 'INTEGER PK', 'Auto-incremental'],
            ['title', 'VARCHAR(500)', 'Título del mercado'],
            ['description', 'TEXT', 'Descripción detallada'],
            ['category', 'ENUM', 'economia, politica, deportes, tecnologia, crypto'],
            ['type', 'ENUM', 'binary, multiple_choice, numeric'],
            ['probability_market', 'FLOAT', 'Probabilidad actual (0-100)'],
            ['volume', 'FLOAT', 'Volumen total en puntos'],
            ['participants_count', 'INTEGER', 'Número de participantes únicos'],
            ['end_date', 'TIMESTAMP', 'Fecha de cierre'],
            ['status', 'ENUM', 'active, resolved, cancelled'],
            ['resolution_value', 'BOOLEAN', 'Resultado (true/false para binary)'],
            ['created_at', 'TIMESTAMP', 'Fecha de creación'],
            ['updated_at', 'TIMESTAMP', 'Última actualización'],
        ],
        col_widths=[3.8 * cm, 4 * cm, PAGE_W - 2 * MARGIN - 7.8 * cm],
    ))
    story.append(Spacer(1, 0.5 * cm))

    # predictions table
    story.append(Paragraph('Tabla: predictions', S['h2']))
    story.append(db_table(
        ['Columna', 'Tipo', 'Descripción'],
        [
            ['id', 'INTEGER PK', 'Auto-incremental'],
            ['user_id', 'INTEGER FK', 'Referencia a users.id'],
            ['market_id', 'INTEGER FK', 'Referencia a markets.id'],
            ['probability', 'FLOAT', 'Probabilidad predicha por el usuario (0-100)'],
            ['points_wagered', 'FLOAT', 'Puntos apostados'],
            ['created_at', 'TIMESTAMP', 'Fecha de creación'],
        ],
        col_widths=[3.5 * cm, 4 * cm, PAGE_W - 2 * MARGIN - 7.5 * cm],
    ))
    story.append(Spacer(1, 0.5 * cm))

    # market_snapshots table
    story.append(Paragraph('Tabla: market_snapshots', S['h2']))
    story.append(db_table(
        ['Columna', 'Tipo', 'Descripción'],
        [
            ['id', 'INTEGER PK', 'Auto-incremental'],
            ['market_id', 'INTEGER FK', 'Referencia a markets.id'],
            ['probability', 'FLOAT', 'Probabilidad del mercado en ese momento'],
            ['timestamp', 'TIMESTAMP', 'Fecha del snapshot (indexado)'],
        ],
        col_widths=[3.5 * cm, 4 * cm, PAGE_W - 2 * MARGIN - 7.5 * cm],
    ))
    story.append(Spacer(1, 0.6 * cm))

    # Seed users
    story.append(section_header('Usuarios de prueba (seed data)'))
    story.append(Spacer(1, 0.3 * cm))
    story.append(db_table(
        ['Email', 'Password', 'Points', 'Rol'],
        [
            ['admin@predictax.com', 'admin1234', '5000', 'Admin'],
            ['demo@predictax.com', 'demo1234', '1000', 'Demo'],
            ['alice@predictax.com', 'alice1234', '2500', 'Usuario'],
            ['bob@predictax.com', 'bob12345', '750', 'Usuario'],
        ],
        col_widths=[5.5 * cm, 3.5 * cm, 2.5 * cm, PAGE_W - 2 * MARGIN - 11.5 * cm],
    ))
    story.append(PageBreak())
    return story


# ── Endpoint detail helper ────────────────────────────────────────────────────
def endpoint_block(method, path, auth, desc_items, body_lines=None,
                   response_lines=None, errors=None, query_params=None):
    items = []
    items.append(method_badge(method, path, auth))
    items.append(Spacer(1, 0.15 * cm))

    for label, text in desc_items:
        row = Table(
            [[Paragraph(label + ':', S['label']), Paragraph(text, S['body'])]],
            colWidths=[3 * cm, PAGE_W - 2 * MARGIN - 3 * cm],
        )
        row.setStyle(TableStyle([
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ]))
        items.append(row)

    if query_params:
        items.append(Paragraph('Query params:', S['label']))
        items.append(Spacer(1, 0.1 * cm))
        items.append(code_block(query_params))

    if body_lines:
        items.append(Paragraph('Body (JSON):', S['label']))
        items.append(Spacer(1, 0.1 * cm))
        items.append(code_block(body_lines))

    if response_lines:
        items.append(Paragraph('Response:', S['label']))
        items.append(Spacer(1, 0.1 * cm))
        items.append(code_block(response_lines))

    if errors:
        err_text = '  |  '.join(errors)
        row = Table(
            [[Paragraph('Errores:', S['label']),
              Paragraph(err_text, ParagraphStyle('err', fontName='Helvetica',
                                                  fontSize=8, textColor=C_ORANGE))]],
            colWidths=[2.5 * cm, PAGE_W - 2 * MARGIN - 2.5 * cm],
        )
        row.setStyle(TableStyle([
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ]))
        items.append(row)

    items.append(Spacer(1, 0.4 * cm))
    return KeepTogether(items)


# ── Endpoints section ─────────────────────────────────────────────────────────
def endpoints_section():
    story = []

    # ── Health ────────────────────────────────────────────────────────────────
    story.append(section_header('Endpoints'))
    story.append(Spacer(1, 0.3 * cm))
    story.append(sub_header('Health'))
    story.append(Spacer(1, 0.3 * cm))

    story.append(endpoint_block(
        'GET', '/api/health', False,
        [('Auth', 'No requerida')],
        response_lines=['{ "status": "healthy", "version": "0.1.0" }'],
    ))

    # ── Auth ──────────────────────────────────────────────────────────────────
    story.append(sub_header('Autenticación — /api/auth'))
    story.append(Spacer(1, 0.3 * cm))

    story.append(endpoint_block(
        'POST', '/api/auth/register', False,
        [('Auth', 'No requerida'),
         ('Validaciones', 'email válido · username 3-50 chars · password 8-100 chars')],
        body_lines=[
            '{',
            '  "email": "usuario@ejemplo.com",',
            '  "username": "miusuario",',
            '  "password": "mipassword123"',
            '}',
        ],
        response_lines=[
            '201 Created',
            '{',
            '  "id": 1,',
            '  "email": "usuario@ejemplo.com",',
            '  "username": "miusuario",',
            '  "points": 1000.0,',
            '  "created_at": "2026-04-01T12:00:00"',
            '}',
        ],
        errors=['400 email/username duplicado', '422 validación fallida'],
    ))

    story.append(endpoint_block(
        'POST', '/api/auth/login', False,
        [('Auth', 'No requerida')],
        body_lines=[
            '{',
            '  "email": "usuario@ejemplo.com",',
            '  "password": "mipassword123"',
            '}',
        ],
        response_lines=[
            '200 OK',
            '{',
            '  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",',
            '  "token_type": "bearer"',
            '}',
        ],
        errors=['401 credenciales inválidas'],
    ))

    story.append(endpoint_block(
        'GET', '/api/auth/me', True,
        [('Auth', 'Bearer token requerido'),
         ('Response', 'Mismo formato que /register — datos del usuario autenticado')],
        errors=['403 sin token', '401 token inválido/expirado'],
    ))

    # ── Markets ───────────────────────────────────────────────────────────────
    story.append(sub_header('Mercados — /api/markets'))
    story.append(Spacer(1, 0.3 * cm))

    story.append(endpoint_block(
        'GET', '/api/markets', False,
        [('Auth', 'No requerida')],
        query_params=[
            'category (opcional): economia | politica | deportes | tecnologia | crypto',
            'status   (opcional, default: active): active | resolved | cancelled',
            'limit    (opcional, default: 20, max: 100)',
            'offset   (opcional, default: 0) — paginación',
        ],
        response_lines=[
            '200 OK  — array de mercados',
            '[',
            '  {',
            '    "id": "1",',
            '    "title": "¿El dólar blue superará los $2000?",',
            '    "category": "economia",',
            '    "type": "binary",',
            '    "probability": 62.0,',
            '    "volume": "$4.5K",',
            '    "participants": 38,',
            '    "status": "active",',
            '    "history": [{"date": "2026-03-25", "probability": 59.0}, ...]',
            '  }',
            ']',
        ],
    ))

    story.append(endpoint_block(
        'GET', '/api/markets/{market_id}', False,
        [('Auth', 'No requerida'),
         ('Path param', 'market_id (integer)')],
        response_lines=['200 OK — objeto mercado (mismo formato que GET /api/markets)'],
        errors=['404 mercado no encontrado'],
    ))

    story.append(endpoint_block(
        'GET', '/api/markets/{market_id}/history', False,
        [('Auth', 'No requerida'),
         ('Path param', 'market_id (integer)')],
        response_lines=[
            '200 OK — historial de probabilidad',
            '[',
            '  {"date": "2026-03-25", "probability": 59.0},',
            '  {"date": "2026-03-26", "probability": 60.5},',
            '  ...',
            ']',
        ],
        errors=['404 mercado no encontrado'],
    ))

    # ── Predictions ───────────────────────────────────────────────────────────
    story.append(sub_header('Predicciones — /api/predictions'))
    story.append(Spacer(1, 0.3 * cm))

    story.append(endpoint_block(
        'POST', '/api/predictions', True,
        [('Auth', 'Bearer token requerido'),
         ('Validaciones', 'probability 0-100 · points_wagered > 0 · saldo suficiente'),
         ('Lógica', 'Descuenta puntos · actualiza probabilidad del mercado · actualiza stats')],
        body_lines=[
            '{',
            '  "market_id": 1,',
            '  "probability": 75.0,',
            '  "points_wagered": 100.0',
            '}',
        ],
        response_lines=[
            '201 Created',
            '{',
            '  "id": 9,',
            '  "user_id": 2,',
            '  "market_id": 1,',
            '  "probability": 75.0,',
            '  "points_wagered": 100.0,',
            '  "created_at": "2026-04-01T12:00:00"',
            '}',
        ],
        errors=['400 puntos insuficientes', '401/403 sin auth', '404 mercado no encontrado'],
    ))

    story.append(endpoint_block(
        'GET', '/api/predictions', True,
        [('Auth', 'Bearer token requerido'),
         ('Descripción', 'Devuelve todas las predicciones del usuario autenticado')],
        response_lines=['200 OK — array de predicciones del usuario'],
    ))

    story.append(endpoint_block(
        'GET', '/api/predictions/market/{market_id}', False,
        [('Auth', 'No requerida'),
         ('Path param', 'market_id (integer)')],
        response_lines=['200 OK — array de todas las predicciones para ese mercado'],
    ))

    # ── Users ─────────────────────────────────────────────────────────────────
    story.append(sub_header('Usuarios — /api/users'))
    story.append(Spacer(1, 0.3 * cm))

    story.append(endpoint_block(
        'GET', '/api/users/leaderboard', False,
        [('Auth', 'No requerida')],
        query_params=['limit (opcional, default: 10, max: 100) — cantidad de usuarios'],
        response_lines=[
            '200 OK — usuarios ordenados por puntos (mayor a menor)',
            '[',
            '  {"id": 1, "email": "admin@predictax.com", "username": "admin", "points": 5000.0, ...},',
            '  ...',
            ']',
        ],
    ))

    story.append(PageBreak())
    return story


# ── Flow section ──────────────────────────────────────────────────────────────
def flow_section():
    story = []
    story.append(section_header('Flujo de prueba integral'))
    story.append(Spacer(1, 0.4 * cm))

    steps = [
        ('1', 'Verificar que la API responde',
         'GET http://localhost:8000/api/health'),
        ('2', 'Registrar un usuario',
         'POST http://localhost:8000/api/auth/register\nBody: {"email":"yo@test.com","username":"yotest","password":"mipass123"}'),
        ('3', 'Login y obtener token',
         'POST http://localhost:8000/api/auth/login\nBody: {"email":"yo@test.com","password":"mipass123"}\n→ Copiar el access_token de la respuesta'),
        ('4', 'Ver perfil autenticado',
         'GET http://localhost:8000/api/auth/me\nHeader: Authorization: Bearer <token>'),
        ('5', 'Listar mercados activos',
         'GET http://localhost:8000/api/markets'),
        ('6', 'Ver detalle de un mercado',
         'GET http://localhost:8000/api/markets/1'),
        ('7', 'Ver historial de probabilidad',
         'GET http://localhost:8000/api/markets/1/history'),
        ('8', 'Hacer una prediccion (requiere auth)',
         'POST http://localhost:8000/api/predictions\nHeader: Authorization: Bearer <token>\nBody: {"market_id":1,"probability":70.0,"points_wagered":100.0}'),
        ('9', 'Ver mis predicciones',
         'GET http://localhost:8000/api/predictions\nHeader: Authorization: Bearer <token>'),
        ('10', 'Ver predicciones de un mercado',
         'GET http://localhost:8000/api/predictions/market/1'),
        ('11', 'Ver leaderboard',
         'GET http://localhost:8000/api/users/leaderboard'),
    ]

    for num, title, cmd in steps:
        step_tbl = Table(
            [[
                Paragraph(num, S['step_num']),
                Paragraph(
                    f'<b>{title}</b><br/>'
                    + cmd.replace('\n', '<br/>').replace('<', '&lt;').replace('>', '&gt;'),
                    S['step_body']
                ),
            ]],
            colWidths=[1 * cm, PAGE_W - 2 * MARGIN - 1 * cm],
        )
        step_tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, 0), C_ACCENT),
            ('BACKGROUND', (1, 0), (1, 0), C_GRAY_BG),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (0, 0), (0, 0), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (1, 0), (1, 0), 10),
            ('BOX', (0, 0), (-1, -1), 0.5, C_GRAY_LIGHT),
        ]))
        story.append(step_tbl)
        story.append(Spacer(1, 0.2 * cm))

    story.append(PageBreak())
    return story


# ── Docker section ────────────────────────────────────────────────────────────
def docker_section():
    story = []
    story.append(section_header('Comandos Docker'))
    story.append(Spacer(1, 0.4 * cm))

    groups = [
        ('Levantar todo el stack (primera vez)', [
            'docker compose build',
            'docker compose up -d',
        ]),
        ('Levantar sin rebuild', [
            'docker compose up -d',
        ]),
        ('Ver logs del backend', [
            'docker compose logs -f backend',
        ]),
        ('Ver estado de los containers', [
            'docker compose ps',
        ]),
        ('Detener todo', [
            'docker compose down',
        ]),
        ('Poblar la base con datos de prueba', [
            'docker compose exec backend python scripts/seed_data.py',
        ]),
        ('Correr las migraciones manualmente', [
            'docker compose exec backend alembic upgrade head',
        ]),
    ]

    for title, cmds in groups:
        story.append(Paragraph(title, S['h3']))
        story.append(code_block(cmds))
        story.append(Spacer(1, 0.3 * cm))

    return story


# ── Build ─────────────────────────────────────────────────────────────────────
def build_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=MARGIN,
        leftMargin=MARGIN,
        topMargin=MARGIN + 0.5 * cm,
        bottomMargin=MARGIN,
        title='PredictaX API — Documentación de Endpoints',
        author='PredictaX',
    )

    story = []
    story += title_page()
    story += db_section()
    story += endpoints_section()
    story += flow_section()
    story += docker_section()

    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    print(f'PDF generado: {output_path}')


if __name__ == '__main__':
    build_pdf('/home/fernando/proyectos/predictax/predictaX/docs/predictaX_API_endpoints.pdf')
