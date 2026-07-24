-- delete_mundial_polls.sql
-- Elimina todos los polls de la categoría "mundial" y sus datos relacionados.
--
-- Uso local:
--   docker compose exec postgres psql -U predictax -d predictax -f /scripts/delete_mundial_polls.sql
--
-- En producción (Neon/Supabase): copiar y pegar en el SQL editor, o correr
-- con psql apuntando a la DB de producción.
--
-- IMPORTANTE: hacer un backup antes de correr en producción.

BEGIN;

-- 1. Borrar predicciones sobre polls del mundial
DELETE FROM predictions
WHERE market_id IN (
    SELECT id FROM markets WHERE category = 'mundial'
);

-- 2. Borrar snapshots de probabilidad históricos
DELETE FROM market_snapshots
WHERE market_id IN (
    SELECT id FROM markets WHERE category = 'mundial'
);

-- 3. Borrar logs de uso de IA relacionados
DELETE FROM ai_usage_log
WHERE market_id IN (
    SELECT id FROM markets WHERE category = 'mundial'
);

-- 4. Borrar los polls en sí
DELETE FROM markets WHERE category = 'mundial';

-- Resumen
DO $$
BEGIN
    RAISE NOTICE 'Polls del mundial eliminados correctamente.';
END $$;

COMMIT;
