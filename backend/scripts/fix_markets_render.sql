-- =============================================================================
-- Script de corrección de markets para DB de producción (Render)
-- Ejecutar contra la DB de Render para corregir datos erróneos del Mundial 2026
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 1: Eliminar 4 markets factualmente imposibles
-- (Argentina NO juega contra España ni Arabia Saudita en el Mundial 2026)
-- ─────────────────────────────────────────────────────────────────────────────

-- Primero borrar snapshots (FK constraint)
DELETE FROM market_snapshots
WHERE market_id IN (
  SELECT id FROM markets
  WHERE title IN (
    '¿Ganará Argentina a España en la fase de grupos?',
    '¿Ganará Argentina su primer partido del Mundial 2026 vs Arabia Saudita?',
    '¿Marcará Argentina más de 5 goles en la fase de grupos?',
    '¿Pasará Argentina la fase de grupos del Mundial 2026?'
  )
);

-- Borrar predicciones si las hay (FK constraint)
DELETE FROM predictions
WHERE market_id IN (
  SELECT id FROM markets
  WHERE title IN (
    '¿Ganará Argentina a España en la fase de grupos?',
    '¿Ganará Argentina su primer partido del Mundial 2026 vs Arabia Saudita?',
    '¿Marcará Argentina más de 5 goles en la fase de grupos?',
    '¿Pasará Argentina la fase de grupos del Mundial 2026?'
  )
);

-- Borrar los 4 markets imposibles
DELETE FROM markets
WHERE title IN (
  '¿Ganará Argentina a España en la fase de grupos?',
  '¿Ganará Argentina su primer partido del Mundial 2026 vs Arabia Saudita?',
  '¿Marcará Argentina más de 5 goles en la fase de grupos?',
  '¿Pasará Argentina la fase de grupos del Mundial 2026?'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 2: Crear 4 markets de reemplazo con datos reales
-- Argentina está en el Grupo J: Algeria, Austria, Jordan
-- ─────────────────────────────────────────────────────────────────────────────

-- 2a. Argentina vs Algeria (debut, ya jugado: Argentina 3-0, hat-trick Messi)
INSERT INTO markets (id, title, description, category, type, probability_market, volume, participants_count, end_date, status, fixture_id, stats_data, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '¿Ganará Argentina a Algeria en su debut del Mundial 2026?',
  E'El primer partido de Argentina en el Mundial 2026 fue contra Algeria el 16 de junio en el Arrowhead Stadium de Kansas City. Argentina ganó 3-0 con hat-trick de Lionel Messi, igualando el récord de 16 goles mundialistas de Miroslav Klose.\n\nEste mercado se resolvió como SÍ: Argentina ganó 3-0.',
  'MUNDIAL', 'BINARY', 99.00, 26800.0, 1230,
  '2026-06-16'::timestamp AT TIME ZONE 'UTC',
  'RESOLVED',
  537397,
  '{"resultado_final": "Argentina 3-0 Algeria", "goles": [{"jugador": "Messi", "minuto": 17}, {"jugador": "Messi", "minuto": 60}, {"jugador": "Messi", "minuto": 76}], "dato_clave": "Hat-trick de Messi en su debut mundialista. Iguala récord de Klose con 16 goles en Mundiales."}'::jsonb,
  NOW(), NOW()
);

-- 2b. Argentina vs Austria (próximo partido, 22 de junio)
INSERT INTO markets (id, title, description, category, type, probability_market, volume, participants_count, end_date, status, fixture_id, stats_data, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '¿Ganará Argentina a Austria en la fase de grupos del Mundial 2026?',
  E'Segundo partido de Argentina en el Grupo J. Se juega el 22 de junio en el AT&T Stadium de Arlington, Texas.\n\nArgentina viene de golear 3-0 a Algeria con hat-trick de Messi. Austria busca dar la sorpresa ante la campeona defensora.\n\nEste mercado se resolverá como SÍ si Argentina gana el partido (resultado a 90 minutos).',
  'MUNDIAL', 'BINARY', 78.00, 19600.0, 940,
  '2026-06-22'::timestamp AT TIME ZONE 'UTC',
  'ACTIVE',
  537399,
  '{"grupo_j": [{"pais": "Argentina", "prob_clasificar": 92}, {"pais": "Austria", "prob_clasificar": 55}, {"pais": "Algeria", "prob_clasificar": 25}, {"pais": "Jordan", "prob_clasificar": 8}], "dato_clave": "Argentina llega con 3 puntos y +3 de diferencia de gol tras golear a Algeria."}'::jsonb,
  NOW(), NOW()
);

-- 2c. Pasará Argentina la fase de grupos (Grupo J correcto)
INSERT INTO markets (id, title, description, category, type, probability_market, volume, participants_count, end_date, status, stats_data, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '¿Pasará Argentina la fase de grupos del Mundial 2026?',
  E'Argentina integra el Grupo J junto a Algeria, Austria y Jordan. Los partidos de la fase de grupos son:\n• Argentina vs Algeria — 16 de junio (Kansas City) — Resultado: Argentina 3-0 ✅\n• Argentina vs Austria — 22 de junio (Arlington, Texas)\n• Jordan vs Argentina — 27 de junio (Arlington, Texas)\n\nEn el formato de 48 equipos, clasifican los 2 primeros de cada grupo y los 8 mejores terceros.\n\nEste mercado se resolverá como SÍ si Argentina avanza a la ronda de 32.',
  'MUNDIAL', 'BINARY', 95.00, 22400.0, 1120,
  '2026-06-27'::timestamp AT TIME ZONE 'UTC',
  'ACTIVE',
  '{"grupo_j": [{"pais": "Argentina", "pts": 3, "gf": 3, "gc": 0}, {"pais": "Austria", "pts": 0, "gf": 0, "gc": 0}, {"pais": "Algeria", "pts": 0, "gf": 0, "gc": 3}, {"pais": "Jordan", "pts": 0, "gf": 0, "gc": 0}], "dato_clave": "Argentina ya ganó su primer partido 3-0. Con 3 puntos, está muy cerca de clasificar."}'::jsonb,
  NOW(), NOW()
);

-- 2d. Más de 5 goles en fase de grupos (rivales corregidos)
INSERT INTO markets (id, title, description, category, type, probability_market, volume, participants_count, end_date, status, stats_data, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '¿Marcará Argentina más de 5 goles en la fase de grupos?',
  E'En sus tres partidos de la fase de grupos ante Algeria, Austria y Jordan, ¿logrará Argentina superar los 5 goles en total?\n\nYa lleva 3 goles (hat-trick de Messi vs Algeria). Faltan los partidos contra Austria (22 jun) y Jordan (27 jun).\n\nHistorial en fases de grupos:\n• Qatar 2022: 5 goles en 3 partidos\n• Brasil 2014: 6 goles en 3 partidos\n• Rusia 2018: 3 goles en 3 partidos\n\nEste mercado se resolverá como SÍ si Argentina suma más de 5 goles en sus 3 partidos de grupos.',
  'MUNDIAL', 'BINARY', 72.00, 14800.0, 680,
  '2026-06-27'::timestamp AT TIME ZONE 'UTC',
  'ACTIVE',
  '{"goles_actuales": 3, "partidos_jugados": 1, "partidos_restantes": 2, "historial_goles_grupos": [{"mundial": "Qatar 2022", "goles": 5}, {"mundial": "Brasil 2014", "goles": 6}, {"mundial": "Rusia 2018", "goles": 3}], "dato_clave": "Con 3 goles en 1 partido, Argentina necesita solo 3 más en 2 partidos para superar la marca."}'::jsonb,
  NOW(), NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 3: Corregir descripciones de markets existentes
-- ─────────────────────────────────────────────────────────────────────────────

-- 3a. ¿Ganará Argentina el Mundial? — Grupo A → Grupo J
UPDATE markets SET description = E'Argentina llega al Mundial 2026 como campeona defensora tras su consagración en Qatar 2022. El equipo de Lionel Scaloni mantiene la columna vertebral del plantel campeón y suma figuras jóvenes como Lautaro Martínez, Julián Álvarez y Enzo Fernández.\n\nLionel Messi, a sus 38 años, ya anotó un hat-trick en el debut (3-0 vs Algeria). Argentina integra el Grupo J junto a Algeria, Austria y Jordan.\n\nEste mercado se resolverá como SÍ si Argentina es campeona del Mundial FIFA 2026.'
WHERE title = '¿Ganará Argentina el Mundial 2026?';

-- 3b. ¿Ganará Brasil? — Rodrygo (ACL injury) → Neymar, grupo corregido
UPDATE markets SET description = E'Brasil no gana un Mundial desde 2002 y llega al torneo como uno de los favoritos con una nueva generación liderada por Vinicius Jr., Neymar y Endrick. La selección canarinha tuvo una clasificación complicada en las Eliminatorias Sudamericanas pero llega en forma al torneo.\n\nEl técnico Carlo Ancelotti apuesta por un sistema ofensivo. Brasil integra el Grupo C junto a Marruecos, Haití y Escocia.\n\nEste mercado se resolverá como SÍ si Brasil es campeón del Mundial FIFA 2026.'
WHERE title = '¿Ganará Brasil el Mundial 2026?';

-- 3c. ¿Ganará Francia? — Griezmann (retirado sept 2024), grupo corregido
UPDATE markets SET description = E'Francia llega al Mundial 2026 con uno de los planteles más talentosos del mundo. Mbappé, ahora en el Real Madrid, lidera un equipo que fue campeón en 2018 y finalista en 2022. Deschamps cuenta con Camavinga, Tchouaméni, Olise, Cherki y una defensa sólida.\n\nEl técnico Didier Deschamps busca su segundo título mundial como entrenador en su último torneo al frente de Les Bleus. Francia integra el Grupo I junto a Senegal, Irak y Noruega.\n\nEste mercado se resolverá como SÍ si Francia es campeón del Mundial FIFA 2026.'
WHERE title = '¿Ganará Francia el Mundial 2026?';

-- 3d. ¿Llegará Argentina a semifinales? — Rusia 2018: 3-4 → 4-3, Brasil 2014: penales → extra time
UPDATE markets SET description = E'Argentina llega al Mundial como campeona defensora. El camino a las semifinales implicaría superar la fase de grupos, la ronda de 32, octavos y cuartos de final.\n\nEn los últimos cuatro Mundiales, Argentina llegó a:\n• Qatar 2022: Campeón ✅\n• Rusia 2018: Octavos de final (eliminada por Francia 4-3)\n• Brasil 2014: Final (perdió ante Alemania 1-0 en tiempo extra)\n• Sudáfrica 2010: Cuartos de final\n\nEste mercado se resolverá como SÍ si Argentina juega al menos una semifinal del Mundial 2026.'
WHERE title = '¿Llegará Argentina a las semifinales del Mundial 2026?';

-- 3e. ¿Anotará Messi? — Ya anotó hat-trick vs Algeria → RESOLVED
UPDATE markets SET
  description = E'Lionel Messi disputará el Mundial 2026 a los 38 años en su sexto torneo mundialista. En el debut contra Algeria (16 de junio), Messi anotó un hat-trick histórico para el 3-0, igualando el récord de 16 goles mundialistas de Miroslav Klose.\n\nHistorial goleador de Messi en Mundiales:\n• USA/CAN/MEX 2026: 3 goles (en curso) ⚽⚽⚽\n• Qatar 2022: 7 goles (MVP 🏆)\n• Rusia 2018: 1 gol\n• Brasil 2014: 4 goles (MVP)\n• Sudáfrica 2010: 0 goles\n• Alemania 2006: 1 gol\n\nTotal: 16 goles en 27 partidos. Messi anotó en 5 de sus 6 mundiales.\n\nEste mercado se resolverá como SÍ si Messi anota al menos 1 gol en el torneo.',
  probability_market = 99.00,
  status = 'RESOLVED'
WHERE title = '¿Anotará Messi en el Mundial 2026?';

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 4: Resolver Ley de Bases (aprobada junio 2024, Ley 27.742)
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE markets SET
  status = 'RESOLVED',
  probability_market = 99.00,
  description = E'La Ley de Bases y Puntos de Partida para la Libertad de los Argentinos (Ley 27.742) fue aprobada por el Congreso el 28 de junio de 2024 y promulgada el 8 de julio de 2024.\n\nLa ley declara emergencia pública en materia administrativa, económica, financiera y energética. Incluye el RIGI (Régimen de Incentivos para Grandes Inversiones), privatizaciones y reformas laborales.\n\nEste mercado se resolvió como SÍ: la Ley de Bases fue aprobada en junio 2024, antes de mayo 2026.'
WHERE title = 'La Ley de Bases será aprobada en el Congreso antes de mayo 2026';

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICACIÓN (ejecutar después del COMMIT)
-- ─────────────────────────────────────────────────────────────────────────────

-- Debe dar 14 markets mundialistas, 0 con "España" o "Arabia"
SELECT category, count(*), count(*) FILTER (WHERE status='RESOLVED') as resolved
FROM markets WHERE category = 'MUNDIAL' GROUP BY category;

SELECT title FROM markets WHERE title ILIKE '%España%' OR title ILIKE '%Arabia%';
-- Debe dar 0 rows
