-- =============================================================================
-- SESIÓN B - Escenario 2: SIN bloqueo (ausencia de FOR UPDATE)
-- Ejecutar en paralelo con la Sesión A.
-- =============================================================================

\echo '=== SESIÓN B (sin FOR UPDATE): Iniciando transacción ==='
BEGIN;

\echo '--- Sesión B: SELECT simple (sin FOR UPDATE, lee stock = 1 también) ---'
SELECT cantidad
  FROM stock_sala
 WHERE id_sala = 901
   AND codigo_vino = 9001;

\echo '--- Sesión B: Intenta vender la misma botella (UPDATE a -1) ---'
UPDATE stock_sala
   SET cantidad = -1
 WHERE id_sala = 901
   AND codigo_vino = 9001;

\echo '--- Sesión B: El UPDATE debe fallar por CHECK (cantidad >= 0) ---'

\echo '--- Sesión B: ROLLBACK ---'
ROLLBACK;

\echo '=== SESIÓN B (sin FOR UPDATE): Transacción finalizada ==='
