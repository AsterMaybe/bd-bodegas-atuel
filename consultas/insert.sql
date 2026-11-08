-- I1 - Insertar en la relación transportista-localidad una nueva cobertura que vincule una localidad 
-- con el transportista que menos envíos (ingresos trasladados) haya realizado en el último trimestre.
-- Parámetros:
-- $1: codigo_postal (localidad_dom, ej: 5620 = General Alvear)

BEGIN;
SELECT
tl.codigo_transp,
t.razon_social,
tl.codigo_postal,
l.nombre AS localidad
FROM TRANSPORTISTA_LOCALIDAD tl
JOIN TRANSPORTISTA t ON tl.codigo_transp = t.codigo
JOIN LOCALIDAD l ON tl.codigo_postal = l.codigo_postal
WHERE l.codigo_postal = $1;

WITH LocalidadDestino AS (
SELECT codigo_postal
FROM LOCALIDAD
WHERE codigo_postal = $1
LIMIT 1
),
TransportistaMenosActivo AS (
SELECT t.codigo
FROM TRANSPORTISTA t
LEFT JOIN INGRESO i ON t.codigo = i.codigo_transp
AND i.fecha >= CURRENT_DATE - INTERVAL '3 months'
GROUP BY t.codigo
ORDER BY COUNT(i.id_documento) ASC, t.codigo ASC
LIMIT 1
)
INSERT INTO TRANSPORTISTA_LOCALIDAD (codigo_transp, codigo_postal)
SELECT tma.codigo, ld.codigo_postal
FROM TransportistaMenosActivo tma
CROSS JOIN LocalidadDestino ld
WHERE NOT EXISTS (
SELECT 1
FROM TRANSPORTISTA_LOCALIDAD tl
WHERE tl.codigo_transp = tma.codigo
AND tl.codigo_postal = ld.codigo_postal
);

SELECT
tl.codigo_transp,
t.razon_social,
tl.codigo_postal,
l.nombre AS localidad
FROM TRANSPORTISTA_LOCALIDAD tl
JOIN TRANSPORTISTA t ON tl.codigo_transp = t.codigo
JOIN LOCALIDAD l ON tl.codigo_postal = l.codigo_postal
WHERE l.codigo_postal = $1;
ROLLBACK;
-- Se utilizan CTEs para buscar dinámicamente el código postal de la localidad y calcular la actividad de los transportistas 
-- mediante un LEFT JOIN (para incluir aquellos con 0 ingresos en ese período). El filtro temporal usa fechas relativas y el 
-- condicional WHERE NOT EXISTS previene errores de clave primaria (violación de UNIQUE) si la relación ya existiera.


-- I2 - Si existe algún vino tinto con graduación de 14° o más, crear el maridaje «cordero al disco» y asociarlo 
-- a todos los vinos que cumplan esa condición.
-- Parámetros:
-- $1: nombre_maridaje (texto, ej: 'cordero al disco')
-- $2: temp_servicio (numeric, ej: 18.00)
-- $3: tipo_vino (texto, ej: 'tinto')
-- $4: graduacion_minima (numeric, ej: 14)

BEGIN;
SELECT
codigo_vino,
nombre,
tipo,
graduacion
FROM VINO
WHERE tipo = $3 AND graduacion >= $4;

WITH NuevoMaridaje AS (
INSERT INTO MARIDAJE (nombre, temp_servicio)
SELECT $1, $2
WHERE EXISTS (
SELECT 1 FROM VINO
WHERE tipo = $3 AND graduacion >= $4
)
RETURNING id_maridaje
)
INSERT INTO VINO_MARIDAJE (codigo_vino, id_maridaje)
SELECT v.codigo_vino, nm.id_maridaje
FROM VINO v
CROSS JOIN NuevoMaridaje nm
WHERE v.tipo = $3 AND v.graduacion >= $4;

SELECT
v.codigo_vino,
v.nombre AS vino,
m.nombre AS maridaje,
v.graduacion
FROM VINO_MARIDAJE vm
JOIN VINO v ON vm.codigo_vino = v.codigo_vino
JOIN MARIDAJE m ON vm.id_maridaje = m.id_maridaje
WHERE m.nombre = $1;
ROLLBACK;
-- Se utiliza una CTE con un INSERT ... RETURNING condicionado por la cláusula EXISTS. Esto permite que en una sola 
-- sentencia se cree el nuevo maridaje (asignando una temperatura sugerida) solo si se cumple la condición, capturando 
-- su ID autogenerado para insertarlo inmediatamente en la tabla asociativa VINO_MARIDAJE cruzándolo con los vinos correspondientes.


-- I3 - Crear un nuevo comprobante con tres renglones para un cliente dado, en una sala dada, dentro de una transacción 
-- y usando las funciones de cálculo.
-- Parámetros:
-- $1: id_cliente (entero, ej: 1)
-- $2: id_sala (entero, ej: 1)
-- $3: codigo_vino_1 (entero, ej: 306)
-- $4: cantidad_1 (entero, ej: 2)
-- $5: codigo_vino_2 (entero, ej: 86)
-- $6: cantidad_2 (entero, ej: 1)
-- $7: codigo_vino_3 (entero, ej: 363)
-- $8: cantidad_3 (entero, ej: 3)

BEGIN;
SELECT
codigo_vino,
cantidad AS stock_previo
FROM STOCK_SALA
WHERE id_sala = $2 AND codigo_vino IN ($3, $5, $7);

WITH NuevoComprobante AS (
INSERT INTO COMPROBANTE (id_cliente, id_sala)
VALUES ($1, $2)
RETURNING nro_comprob
),
DetalleRenglones (codigo_vino, cantidad) AS (
VALUES
(
($3, $4),
($5, $6),
($7, $8)
)
)
INSERT INTO RENGLON_COMPROBANTE (
nro_comprob, codigo_vino, cantidad, precio_unitario, descuento, subtotal
)
SELECT
nc.nro_comprob,
dr.codigo_vino,
dr.cantidad,
v.precio,
fn_calcular_descuento_renglon(dr.cantidad, v.precio, fn_descuento_cliente($1)),
fn_calcular_subtotal_renglon(dr.cantidad, v.precio, fn_calcular_descuento_renglon(dr.cantidad, v.precio, fn_descuento_cliente($1)))
FROM NuevoComprobante nc
CROSS JOIN DetalleRenglones dr
JOIN VINO v ON v.codigo_vino = dr.codigo_vino;

SELECT
c.nro_comprob,
c.id_cliente,
c.subtotal,
c.descuento,
c.total
FROM COMPROBANTE c
ORDER BY c.nro_comprob DESC
LIMIT 1;

SELECT
codigo_vino,
cantidad AS stock_nuevo
FROM STOCK_SALA
WHERE id_sala = $2 AND codigo_vino IN ($3, $5, $7);
ROLLBACK;
-- Se utiliza una CTE con RETURNING para crear la cabecera en estado inicial e inyectar su ID generado en los detalles. 
-- Los renglones se construyen invocando las funciones matemáticas fn_calcular_descuento_renglon() y 
-- fn_calcular_subtotal_renglon() para cumplir la consigna, lo que dispara los triggers que validarán/descontarán el 
-- stock de la sala y acumularán los totales definitivos en la cabecera.


-- I4 - Insertar una nueva bodega.
-- Parámetros:
-- $1: cuit (cuit_dom, ej: '30112223334')
-- $2: razon_social (texto, ej: 'Bodega Nueva Recontra Real Creanme S.A.')
-- $3: domicilio (texto, ej: 'Ruta 143 Km 20, San Rafael')

BEGIN;
SELECT
cuit,
razon_social,
domicilio
FROM BODEGA
WHERE cuit = $1;

INSERT INTO BODEGA (cuit, razon_social, domicilio)
VALUES ($1, $2, $3);

SELECT
cuit,
razon_social,
domicilio
FROM BODEGA
WHERE cuit = $1;
ROLLBACK;
-- Se realiza una inserción directa con la cláusula VALUES sobre la tabla BODEGA. El valor ingresado para la clave 
-- primaria debe respetar estrictamente el dominio cuit_dom, el cual exige mediante la restricción chk_cuit_dom_formato 
-- que contenga exactamente 11 dígitos numéricos sin guiones


-- I5 - Insertar una nueva sala de venta.
-- Parámetros:
-- $1: numero (entero, ej: 1500)
-- $2: calle (texto, ej: 'Av. Hipólito Yrigoyen')
-- $3: dia_de_cierre (entero 1-7, ej: 7)
-- $4: codigo_postal (localidad_dom, ej: '5600')

BEGIN;
SELECT
id_sala,
calle,
numero,
dia_de_cierre,
codigo_postal
FROM SALA_VENTA
WHERE calle = $2 AND numero = $1;

INSERT INTO SALA_VENTA (numero, calle, dia_de_cierre, codigo_postal)
VALUES ($1, $2, $3, $4);

SELECT
id_sala,
calle,
numero,
dia_de_cierre,
codigo_postal
FROM SALA_VENTA
WHERE calle = $2 AND numero = $1;
ROLLBACK;
-- Se realiza una inserción directa con la cláusula VALUES omitiendo la columna id_sala, ya que al ser de tipo SERIAL 
-- se autogenera. Los datos ingresados deben superar los CHECK de negocio (número positivo y día de cierre entre 1 y 7), 
-- y el código postal debe existir previamente en la tabla LOCALIDAD por la restricción de clave foránea.


-- I6 - Crear un ingreso en confección de botellas de un vino determinado, elaborado por una bodega dada y trasladado por un transportista dado.
-- Parámetros:
-- $1: codigo_vino (entero, ej: 10)
-- $2: cuit_bodega (cuit_dom, ej: '30000000001')
-- $3: codigo_transp (entero, ej: 5)
-- $4: cantidad (entero, ej: 120)

BEGIN;
SELECT
v.codigo_vino,
v.nombre AS vino,
v.cuit_bodega,
t.codigo AS codigo_transp,
t.razon_social AS transportista
FROM VINO v
CROSS JOIN TRANSPORTISTA t
WHERE v.codigo_vino = $1 AND t.codigo = $3;

WITH NuevoIngreso AS (
INSERT INTO INGRESO (fecha, cuit_bodega, codigo_transp, estado)
VALUES (CURRENT_DATE, $2, $3, 'en_confeccion')
RETURNING id_documento
)
INSERT INTO RENGLON_INGRESO (id_documento, codigo_vino, cantidad)
SELECT
ni.id_documento,
$1,
$4
FROM NuevoIngreso ni;

SELECT
i.id_documento,
i.fecha,
i.estado,
i.cuit_bodega,
i.codigo_transp,
ri.codigo_vino,
v.nombre AS vino,
ri.cantidad
FROM INGRESO i
JOIN RENGLON_INGRESO ri ON i.id_documento = ri.id_documento
JOIN VINO v ON ri.codigo_vino = v.codigo_vino
ORDER BY i.id_documento DESC
LIMIT 1;
ROLLBACK;
-- Se utiliza una CTE con la cláusula RETURNING para insertar la cabecera en la tabla INGRESO con el estado solicitado 
-- y capturar su id_documento autogenerado. Este identificador se inyecta inmediatamente en la segunda instrucción 
-- INSERT para crear el detalle en RENGLON_INGRESO, garantizando la integridad referencial en una sola pasada.