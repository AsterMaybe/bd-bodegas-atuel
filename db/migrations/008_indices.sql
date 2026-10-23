-- =============================================================================
-- ETAPA 4: ÍNDICES Y RENDIMIENTO (008_indices.sql)
-- =============================================================================

-- 1. ÍNDICE SOBRE CLAVE FORÁNEA (FK en COMPROBANTE -> CLIENTE)
-- Justificación: PostgreSQL no indexa las claves foráneas automáticamente.
-- Optimiza la unión (JOIN) entre COMPROBANTE y CLIENTE en la consulta S3, 
-- además de acelerar las validaciones y borrados de clientes (D1, D4, D6).
CREATE INDEX idx_fk_comprobante_cliente 
ON COMPROBANTE (id_cliente);


-- 2. ÍNDICE SOBRE CLAVE FORÁNEA (FK en RENGLON_TRANSFERENCIA -> VINO)
-- Justificación: Acelera la búsqueda y el filtrado de renglones de transferencia 
-- para un vino específico (WHERE codigo_vino = X) en la consulta S4, pasando de 
-- un recorrido secuencial (Seq Scan) a un Index Scan / Bitmap Index Scan.
CREATE INDEX idx_fk_renglon_transf_vino 
ON RENGLON_TRANSFERENCIA (codigo_vino);


-- 3. ÍNDICE COMPUESTO CON COLUMNAS INCLUIDAS (INCLUDE / VARIANTE AVANZADA)
-- Justificación: Optimiza las consultas S8 (monto total de ventas por sala en el 
-- último trimestre) y S3 (ventas de una sala en la última semana). Gracias a la 
-- cláusula INCLUDE (total, id_cliente), PostgreSQL puede resolver S8 y S3 mediante 
-- un Index Only Scan leyendo los datos directamente del índice sin ir a la tabla.
--
-- Justificación del orden de las columnas (fecha, id_sala):
-- En la consulta S8 se filtra por un rango de fechas (WHERE fecha >= CURRENT_DATE - INTERVAL '3 months')
-- para todas las salas sin filtrar por un id_sala específico. Al ubicar 'fecha' 
-- como primera columna del árbol B-Tree, el motor acota directamente el rango 
-- temporal del trimestre y solo lee esa porción del índice. Si 'id_sala' estuviera 
-- primero, no podría acotar el árbol de entrada por fecha y preferiría un Seq Scan.
CREATE INDEX idx_comprobante_fecha_sala_inc 
ON COMPROBANTE (fecha, id_sala) INCLUDE (total, id_cliente);


-- 4. ÍNDICE PARCIAL (con cláusula WHERE)
-- Justificación: Cumple con el requisito de índice parcial para optimizar la 
-- consulta S5 (salas con menor cantidad de transferencias pendientes / no procesadas).
-- En lugar de indexar todo el historial de transferencias (donde la mayoría ya están 
-- en estado 'procesado'), indexa únicamente las filas activas/pendientes, logrando 
-- un índice muy liviano en disco y rápido de recorrer.
CREATE INDEX idx_transferencia_pendientes 
ON TRANSFERENCIA (id_sala, fecha)
WHERE estado <> 'procesado';


-- 5. ÍNDICE COMPUESTO (en TRANSFERENCIA)
-- Justificación: Optimiza el filtro de los últimos 15 días (WHERE fecha >= CURRENT_DATE - INTERVAL '15 days')
-- y la agrupación por id_sala en la consulta S4, evitando recorrer toda la tabla TRANSFERENCIA.
CREATE INDEX idx_transferencia_fecha_sala 
ON TRANSFERENCIA (fecha, id_sala);


-- =============================================================================
-- DOCUMENTACIÓN PASO 6: ÍNDICE EVALUADO Y DESCARTADO
-- =============================================================================

-- Índice evaluado y descartado:
-- CREATE INDEX idx_fk_renglon_comprobante_vino ON RENGLON_COMPROBANTE (codigo_vino);
--
-- Motivo del descarte:
-- Se diseñó inicialmente buscando optimizar la consulta S1 (Ranking de los 10 vinos 
-- con mayor cantidad de botellas vendidas en toda la red). Al medir con EXPLAIN (ANALYZE, BUFFERS),
-- se comprobó que el tiempo de ejecución no mejoró (57.292 ms antes vs. 58.604 ms después)
-- porque el planificador no utiliza el índice. En cambio, en las pruebas de costo de 
-- escritura sobre RENGLON_COMPROBANTE, mantener índices sobre esta columna incrementó 
-- el tiempo de inserción masiva de 1210.316 ms a 4167.916 ms (3.4x más lento). 
-- Por lo tanto, se descartó para no penalizar las escrituras de ventas sin beneficio en lecturas.



-- Caso demostrado: Consulta S1 sobre la tabla RENGLON_COMPROBANTE teniendo creado 
-- el índice idx_fk_renglon_comprobante_vino (codigo_vino).
--
-- Causa (Baja selectividad / Lectura del 100% de la tabla):
-- La consulta S1 calcula la suma histórica de botellas vendidas (SUM(rc.cantidad)) 
-- agrupando por vino sobre la totalidad de la tabla, sin ninguna cláusula WHERE que 
-- filtre filas. Como PostgreSQL está obligado a leer el 100% de los registros de 
-- RENGLON_COMPROBANTE, el optimizador de costos determina que recorrer el índice B-Tree 
-- y saltar a las páginas de la tabla (Random I/O) es mucho más costoso que leer los 
-- bloques de la tabla de forma secuencial y en paralelo (Parallel Seq Scan + HashAggregate).