-- Indices Etapa 4


-- 1. ÍNDICE SOBRE CLAVE FORÁNEA (FK en RENGLON_COMPROBANTE)
-- Justificación: Postgres no indexa FKs por defecto. Optimiza la unión (JOIN) entre 
-- RENGLON_COMPROBANTE y VINO para la consulta S1.
CREATE INDEX idx_fk_renglon_comprobante_vino 
ON RENGLON_COMPROBANTE (codigo_vino);
-- Documentacion caso donde PostgreSQL ignora un índice existente:
-- La consulta S1 busca calcular la suma de todas las botellas vendidas 
-- históricamente (SUM(rc.cantidad)) de todos los vinos. Como no tiene un WHERE 
-- que limite la búsqueda a un mes específico o a una sala en particular, PostgreSQL 
-- necesita leer el 100% de las filas de la tabla RENGLON_COMPROBANTE. Al no haber un 
-- filtro que reduzca la cantidad de datos, el costo de usar el índice es mayor que el 
-- costo de leer la tabla de forma predeterminada.


-- 2. ÍNDICE CON COLUMNAS INCLUIDAS (INCLUDE / VARIANTE AVANZADA)
-- Justificación: Permite realizar un Index Only Scan en S1, leyendo la cantidad de 
-- botellas sin tener que ir a consultar las páginas principales de la tabla.
CREATE INDEX idx_renglon_comp_vino_cant 
ON RENGLON_COMPROBANTE (codigo_vino) INCLUDE (cantidad);


-- 3. ÍNDICE COMPUESTO
-- Justificación: Optimiza la consulta S8 al combinar la agrupación por id_sala 
-- y el filtrado por fecha en un solo árbol B-Tree.
CREATE INDEX idx_comprobante_sala_fecha 
ON COMPROBANTE (id_sala, fecha);
-- Justificacion columnas del Indice Compuesto:
-- El orden es (id_sala, fecha) porque la base de datos necesita agrupar las ventas 
-- por sucursal para calcular los totales. Al poner la sala primero, todos los datos 
-- de una misma sucursal quedan ordenados y juntos en el índice; esto permite que aplicar 
-- el filtro de fecha y sumar los montos sea un proceso directo y mucho más rápido.


-- 4. ÍNDICE PARCIAL 
-- Justificación: Cumple con la restricción de índice parcial. En lugar de indexar
-- todo el historial de transferencias, solo indexa las transferencias recientes o
-- no procesadas, reduciendo el tamaño del índice en disco y optimizando la consulta S4.
CREATE INDEX idx_transferencia_recientes 
ON TRANSFERENCIA (fecha, id_sala)
WHERE fecha >= '2026-01-01';  -- O WHERE estado <> 'procesado'


-- 5. ÍNDICE SOBRE CLAVE FORÁNEA (FK en Transferencias)
-- Justificación: Acelera la búsqueda y filtrado de renglones por vino en S4.
CREATE INDEX idx_fk_renglon_transf_vino 
ON RENGLON_TRANSFERENCIA (codigo_vino);