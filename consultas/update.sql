-- U1 - Recalcular el total de todos los comprobantes aplicando el descuento que corresponde al tipo de cliente.

BEGIN;
SELECT 
    c.nro_comprob, 
    c.id_cliente,
    c.subtotal AS subtotal_actual, 
    c.descuento AS descuento_actual, 
    c.total AS total_actual,
    fn_descuento_cliente(c.id_cliente) AS porc_aplicable
FROM COMPROBANTE c
ORDER BY c.nro_comprob
LIMIT 5;

WITH TotalesBrutos AS (
    SELECT 
        nro_comprob,
        COALESCE(SUM(ROUND(cantidad * precio_unitario, 2)), 0.00) AS suma_bruta
    FROM RENGLON_COMPROBANTE
    GROUP BY nro_comprob
)
UPDATE COMPROBANTE c
SET 
    subtotal = tb.suma_bruta,
    descuento = ROUND(tb.suma_bruta * (fn_descuento_cliente(c.id_cliente) / 100.0), 2),
    total = tb.suma_bruta - ROUND(tb.suma_bruta * (fn_descuento_cliente(c.id_cliente) / 100.0), 2)
FROM TotalesBrutos tb
WHERE c.nro_comprob = tb.nro_comprob;

SELECT 
    c.nro_comprob, 
    c.id_cliente,
    c.subtotal AS subtotal_nuevo, 
    c.descuento AS descuento_nuevo, 
    c.total AS total_nuevo,
    fn_descuento_cliente(c.id_cliente) AS porc_aplicable
FROM COMPROBANTE c
ORDER BY c.nro_comprob
LIMIT 5;
ROLLBACK;
-- Se utiliza una CTE (TotalesBrutos) para agrupar y sumarizar eficientemente el valor bruto (cantidad * precio) 
-- de los renglones. Luego, mediante un UPDATE...FROM, se cruzan estos valores con la cabecera. La regla del 
-- porcentaje (RN-06) no se hardcodea, sino que se delega a la función fn_descuento_cliente() del esquema.


-- U2 - Aumentar un 20 % el salario de los empleados con más de 5 años de antigüedad.

BEGIN;
SELECT
p.cuit,
p.nombre,
p.fecha_ingreso,
fn_antiguedad_anios(p.fecha_ingreso) AS antiguedad,
p.salario AS salario_actual
FROM PERSONAL p
JOIN EMPLEADO e ON p.cuit = e.cuit
WHERE fn_antiguedad_anios(p.fecha_ingreso) > 5;

UPDATE PERSONAL p
SET salario = ROUND(p.salario * 1.20, 2)
FROM EMPLEADO e
WHERE p.cuit = e.cuit
AND fn_antiguedad_anios(p.fecha_ingreso) > 5;

SELECT
p.cuit,
p.nombre,
p.fecha_ingreso,
fn_antiguedad_anios(p.fecha_ingreso) AS antiguedad,
p.salario AS salario_nuevo
FROM PERSONAL p
JOIN EMPLEADO e ON p.cuit = e.cuit
WHERE fn_antiguedad_anios(p.fecha_ingreso) > 5;
ROLLBACK;
-- Se actualiza la superclase PERSONAL filtrando mediante un JOIN implícito (FROM) con la subclase 
-- EMPLEADO. La antigüedad se evalúa dinámicamente usando la función del sistema fn_antiguedad_anios() 
-- para cumplir con el requisito de fechas relativas.


-- U3 - Incrementar un 13 % el precio de los vinos elaborados por una bodega determinada.

BEGIN;
SELECT
codigo_vino,
nombre,
cuit_bodega,
precio AS precio_actual
FROM VINO
WHERE cuit_bodega = '20123456789'; -- Este cuit lo cambiamos segun la bodega que queramos aumentarle el precio.

UPDATE VINO
SET precio = ROUND(precio * 1.13, 2)
WHERE cuit_bodega = '20123456789';

SELECT
codigo_vino,
nombre,
cuit_bodega,
precio AS precio_nuevo
FROM VINO
WHERE cuit_bodega = '20123456789';

SELECT
id_auditoria,
codigo_vino,
precio_anterior,
precio_nuevo,
fecha_hora,
usuario
FROM AUDITORIA_PRECIO
ORDER BY id_auditoria DESC
LIMIT 5;
ROLLBACK;
-- Se actualiza directamente la tabla VINO filtrando por su clave foránea cuit_bodega. Esta modificación dispara 
-- de forma transparente el trigger trg_vino_auditoria_precio (RN-13), el cual registra automáticamente la variación en 
-- la tabla AUDITORIA_PRECIO.


-- U4 - En las salas cuyo día de cierre es lunes cambiarlo a miércoles y viceversa, en una sola sentencia.

BEGIN;
SELECT
id_sala,
calle,
numero,
dia_de_cierre AS dia_actual
FROM SALA_VENTA
WHERE dia_de_cierre IN (1, 3);

UPDATE SALA_VENTA
SET dia_de_cierre = CASE
WHEN dia_de_cierre = 1 THEN 3
WHEN dia_de_cierre = 3 THEN 1
END
WHERE dia_de_cierre IN (1, 3);

SELECT
id_sala,
calle,
numero,
dia_de_cierre AS dia_nuevo
FROM SALA_VENTA
WHERE dia_de_cierre IN (1, 3);
ROLLBACK;
-- Se utiliza una expresión condicional CASE dentro del UPDATE para intercambiar ambos valores 
-- (sabiendo que 1 = Lunes y 3 = Miércoles) en una única operación. Se incluye la cláusula WHERE IN (1, 3) 
-- para evitar bloqueos y actualizaciones innecesarias en salas que no requieren cambios.


-- U5 - Aplicar un 15 % de descuento de precio a los 10 vinos menos vendidos de toda la red.

BEGIN;
SELECT
v.codigo_vino,
v.nombre,
COALESCE(SUM(rc.cantidad), 0) AS total_vendido,
v.precio AS precio_actual
FROM VINO v
LEFT JOIN RENGLON_COMPROBANTE rc ON v.codigo_vino = rc.codigo_vino
GROUP BY v.codigo_vino, v.nombre, v.precio
ORDER BY total_vendido ASC, v.codigo_vino ASC
LIMIT 10;

WITH MenosVendidos AS (
SELECT v.codigo_vino
FROM VINO v
LEFT JOIN RENGLON_COMPROBANTE rc ON v.codigo_vino = rc.codigo_vino
GROUP BY v.codigo_vino
ORDER BY COALESCE(SUM(rc.cantidad), 0) ASC, v.codigo_vino ASC
LIMIT 10
)
UPDATE VINO
SET precio = ROUND(precio * 0.85, 2)
WHERE codigo_vino IN (SELECT codigo_vino FROM MenosVendidos);

SELECT
v.codigo_vino,
v.nombre,
COALESCE(SUM(rc.cantidad), 0) AS total_vendido,
v.precio AS precio_nuevo
FROM VINO v
LEFT JOIN RENGLON_COMPROBANTE rc ON v.codigo_vino = rc.codigo_vino
GROUP BY v.codigo_vino, v.nombre, v.precio
ORDER BY total_vendido ASC, v.codigo_vino ASC
LIMIT 10;
ROLLBACK;
-- Se utiliza una CTE combinada con un LEFT JOIN para asegurar que los vinos con cero ventas también sean contemplados 
-- en el ranking de los "menos vendidos". El filtrado final del UPDATE se realiza mediante la subconsulta y esta modificación 
-- dispara automáticamente el trigger de auditoría de precios.


-- U6 - A los exportadores con más de 3 permisos de exportación, subirles el descuento al 35%.

BEGIN;
SELECT
c.id_cliente,
c.nombre_razon,
COUNT(pe.codigo_permiso) AS cantidad_permisos,
c.descuento AS descuento_actual
FROM CLIENTE c
JOIN EXPORTADOR e ON c.id_cliente = e.id_cliente
JOIN PERMISO_EXPORTADOR pe ON e.id_cliente = pe.id_cliente
GROUP BY c.id_cliente, c.nombre_razon, c.descuento
HAVING COUNT(pe.codigo_permiso) > 3;

WITH ExportadoresDestacados AS (
SELECT id_cliente
FROM PERMISO_EXPORTADOR
GROUP BY id_cliente
HAVING COUNT(codigo_permiso) > 3
)
UPDATE CLIENTE c
SET descuento = 35.00
FROM ExportadoresDestacados ed
WHERE c.id_cliente = ed.id_cliente;

SELECT
c.id_cliente,
c.nombre_razon,
COUNT(pe.codigo_permiso) AS cantidad_permisos,
c.descuento AS descuento_nuevo
FROM CLIENTE c
JOIN EXPORTADOR e ON c.id_cliente = e.id_cliente
JOIN PERMISO_EXPORTADOR pe ON e.id_cliente = pe.id_cliente
GROUP BY c.id_cliente, c.nombre_razon, c.descuento
HAVING COUNT(pe.codigo_permiso) > 3;
ROLLBACK;
-- Se utiliza una CTE con GROUP BY y la cláusula HAVING para aislar los IDs que superan los 3 permisos. 
-- Luego se actualiza el descuento directamente en la superclase CLIENTE; este nuevo valor (35%) será respetado 
-- automáticamente por la función fn_descuento_cliente() al ser mayor que el 30% asignado por defecto a su subclase.