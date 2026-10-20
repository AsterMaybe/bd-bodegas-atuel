-- =============================================================================
-- SESIÓN A - Escenario 2: SIN bloqueo (ausencia de FOR UPDATE)
-- Ejecutar en paralelo con la Sesión B.
-- =============================================================================

\echo '=== SESIÓN A (sin FOR UPDATE): Iniciando transacción ==='
BEGIN;

\echo '--- Sesión A: SELECT simple (sin FOR UPDATE, sin bloqueo) ---'
SELECT cantidad
  FROM stock_sala
 WHERE id_sala = 901
   AND codigo_vino = 9001;

\echo '--- Sesión A: Espera 3 segundos para que la Sesión B también lea el stock ---'
SELECT pg_sleep(3);

\echo '--- Sesión A: Stock leído = 1. Ahora actualiza a 0 (vende la última botella) ---'
UPDATE stock_sala
   SET cantidad = 0
 WHERE id_sala = 901
   AND codigo_vino = 9001;

\echo '--- Sesión A: Registra la venta ---'
INSERT INTO comprobante (nro_comprob, fecha, subtotal, descuento, total, id_cliente, id_sala)
VALUES (9502, CURRENT_TIMESTAMP, 0.00, 0.00, 0.00, 9001, 901);

INSERT INTO renglon_comprobante (nro_comprob, codigo_vino, cantidad, precio_unitario, descuento, subtotal)
VALUES (9502, 9001, 1, 12500.00, 0.00, 12500.00);

\echo '--- Sesión A: COMMIT ---'
COMMIT;

\echo '=== SESIÓN A (sin FOR UPDATE): Transacción finalizada ==='
