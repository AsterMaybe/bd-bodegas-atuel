-- =============================================================================
-- SESIÓN B - Escenario 1: Con bloqueo explícito (SELECT ... FOR UPDATE)
-- Ejecutar en paralelo con la Sesión A.
-- =============================================================================

\echo '=== SESIÓN B (con FOR UPDATE): Iniciando transacción ==='
BEGIN;

\echo '--- Sesión B: SELECT ... FOR UPDATE (quedará BLOQUEADA hasta que A haga COMMIT) ---'
SELECT cantidad
  FROM stock_sala
 WHERE id_sala = 901
   AND codigo_vino = 9001
FOR UPDATE;

\echo '--- Sesión B: Desbloqueada. Lee stock tras COMMIT de A ---'

\echo '--- Sesión B: Intenta vender la misma botella (UPDATE a -1) ---'
UPDATE stock_sala
   SET cantidad = -1
 WHERE id_sala = 901
   AND codigo_vino = 9001;

\echo '--- Sesión B: El UPDATE debe fallar por CHECK (cantidad >= 0) ---'

\echo '--- Sesión B: ROLLBACK ---'
ROLLBACK;

\echo '=== SESIÓN B (con FOR UPDATE): Transacción finalizada ==='
