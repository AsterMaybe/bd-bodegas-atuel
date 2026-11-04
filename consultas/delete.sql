-- D1 - Borrar los comprobantes con más de 5 años de antigüedad asociados a clientes socios del club.

BEGIN;
SELECT 
    c.nro_comprob, 
    c.id_cliente, 
    c.fecha,
    fn_antiguedad_anios(c.fecha::date) AS antiguedad
FROM COMPROBANTE c
JOIN SOCIO_CLUB s ON c.id_cliente = s.id_cliente
WHERE fn_antiguedad_anios(c.fecha::date) > 5;

DELETE FROM COMPROBANTE c
USING SOCIO_CLUB s
WHERE c.id_cliente = s.id_cliente
  AND fn_antiguedad_anios(c.fecha::date) > 5;

SELECT 
    c.nro_comprob, 
    c.id_cliente, 
    c.fecha,
    fn_antiguedad_anios(c.fecha::date) AS antiguedad
FROM COMPROBANTE c
JOIN SOCIO_CLUB s ON c.id_cliente = s.id_cliente
WHERE fn_antiguedad_anios(c.fecha::date) > 5;
ROLLBACK;
-- Se utiliza la cláusula USING en el DELETE para filtrar la tabla COMPROBANTE cruzándola directamente con la 
-- subclase SOCIO_CLUB. La antigüedad se evalúa reutilizando la función fn_antiguedad_anios(), delegando a la base de datos 
-- la eliminación de los detalles mediante borrado en cascada (ON DELETE CASCADE) si estuviera configurado.


-- D2 - Eliminar las cepas que no componen ningún vino ni están plantadas en ninguna parcela.

BEGIN;
SELECT 
    c.id_cepa, 
    c.nombre, 
    c.tipo 
FROM CEPA c
WHERE NOT EXISTS (
    SELECT 1 FROM COMPOSICION_VINO vc WHERE vc.id_cepa = c.id_cepa
)
AND NOT EXISTS (
    SELECT 1 FROM PARCELA p WHERE p.id_cepa = c.id_cepa
);

DELETE FROM CEPA c
WHERE NOT EXISTS (
    SELECT 1 FROM COMPOSICION_VINO vc WHERE vc.id_cepa = c.id_cepa
)
AND NOT EXISTS (
    SELECT 1 FROM PARCELA p WHERE p.id_cepa = c.id_cepa
);

SELECT 
    c.id_cepa, 
    c.nombre, 
    c.tipo 
FROM CEPA c
WHERE NOT EXISTS (
    SELECT 1 FROM COMPOSICION_VINO vc WHERE vc.id_cepa = c.id_cepa
)
AND NOT EXISTS (
    SELECT 1 FROM PARCELA p WHERE p.id_cepa = c.id_cepa
);
ROLLBACK;
-- Se utilizan subconsultas con la cláusula NOT EXISTS para identificar y aislar las cepas huérfanas. 
-- Esta estrategia asegura que solo se eliminen los registros sin dependencias en COMPOSICION_VINO ni PARCELA, 
-- previniendo cualquier error por violación de restricción de clave foránea.


-- D3 - La sala de una localidad determinada fue dada de baja: eliminar los empleados de esa sala que trabajaron menos de dos años.

BEGIN;
SELECT 
    p.cuit, 
    p.nombre, 
    p.fecha_ingreso,
    fn_antiguedad_anios(p.fecha_ingreso) AS antiguedad,
    e.id_sala,
    l.nombre AS localidad
FROM PERSONAL p
JOIN EMPLEADO e ON p.cuit = e.cuit
JOIN SALA_VENTA s ON e.id_sala = s.id_sala
JOIN LOCALIDAD l ON s.codigo_postal = l.codigo_postal
WHERE l.nombre = 'General Alvear' -- Localidad que se quiera elegir
  AND fn_antiguedad_anios(p.fecha_ingreso) < 2;

DELETE FROM PERSONAL p
USING EMPLEADO e, SALA_VENTA s, LOCALIDAD l
WHERE p.cuit = e.cuit
  AND e.id_sala = s.id_sala
  AND s.codigo_postal = l.codigo_postal
  AND l.nombre = 'General Alvear' 
  AND fn_antiguedad_anios(p.fecha_ingreso) < 2;

SELECT 
    p.cuit, 
    p.nombre, 
    p.fecha_ingreso,
    fn_antiguedad_anios(p.fecha_ingreso) AS antiguedad,
    e.id_sala,
    l.nombre AS localidad
FROM PERSONAL p
JOIN EMPLEADO e ON p.cuit = e.cuit
JOIN SALA_VENTA s ON e.id_sala = s.id_sala
JOIN LOCALIDAD l ON s.codigo_postal = l.codigo_postal
WHERE l.nombre = 'General Alvear' 
  AND fn_antiguedad_anios(p.fecha_ingreso) < 2;
ROLLBACK;
-- Se utiliza la cláusula USING en el DELETE para resolver de forma limpia la cadena de JOINs desde EMPLEADO 
-- hasta LOCALIDAD. La eliminación impacta directamente en la superclase PERSONAL (asumiendo que la base delegará en 
-- ON DELETE CASCADE la baja física de la subclase) y se filtra la antigüedad dinámicamente.


-- D4 - Borrar los clientes socios que nunca compraron y se dieron de alta hace más de 5 años.

BEGIN;
SELECT 
    c.id_cliente, 
    c.nombre_razon, 
    c.fecha_alta, 
    fn_antiguedad_anios(c.fecha_alta) AS antiguedad
FROM CLIENTE c
JOIN SOCIO_CLUB sc ON c.id_cliente = sc.id_cliente
WHERE NOT EXISTS (
    SELECT 1 FROM COMPROBANTE comp WHERE comp.id_cliente = c.id_cliente
)
AND fn_antiguedad_anios(c.fecha_alta) > 5;

DELETE FROM CLIENTE c
USING SOCIO_CLUB sc
WHERE c.id_cliente = sc.id_cliente
  AND NOT EXISTS (
      SELECT 1 FROM COMPROBANTE comp WHERE comp.id_cliente = c.id_cliente
  )
  AND fn_antiguedad_anios(c.fecha_alta) > 5;

SELECT 
    c.id_cliente, 
    c.nombre_razon, 
    c.fecha_alta, 
    fn_antiguedad_anios(c.fecha_alta) AS antiguedad
FROM CLIENTE c
JOIN SOCIO_CLUB sc ON c.id_cliente = sc.id_cliente
WHERE NOT EXISTS (
    SELECT 1 FROM COMPROBANTE comp WHERE comp.id_cliente = c.id_cliente
)
AND fn_antiguedad_anios(c.fecha_alta) > 5;
ROLLBACK;
-- Se utiliza el nombre exacto de la tabla subclase SOCIO_CLUB y el atributo fecha_alta de la superclase 
-- CLIENTE[cite: 1]. La eliminación se ejecuta sobre CLIENTE utilizando USING para el JOIN; gracias a la restricción 
-- fk_socio_club_cliente configurada con ON DELETE CASCADE[cite: 2], el motor se encargará automáticamente de borrar 
-- el registro dependiente en la subclase, asegurando la integridad. El cálculo temporal reutiliza fn_antiguedad_anios()[cite: 3].


-- D5 - Eliminar los ingresos en estado procesado de hace más de 365 días.

BEGIN;
SELECT 
    id_documento, 
    fecha, 
    estado, 
    cuit_bodega, 
    codigo_transp
FROM INGRESO
WHERE estado = 'procesado'
  AND (CURRENT_DATE - fecha) > 365;

DELETE FROM INGRESO
WHERE estado = 'procesado'
  AND (CURRENT_DATE - fecha) > 365;

SELECT 
    id_documento, 
    fecha, 
    estado, 
    cuit_bodega, 
    codigo_transp
FROM INGRESO
WHERE estado = 'procesado'
  AND (CURRENT_DATE - fecha) > 365;
ROLLBACK;
-- Se filtra directamente la cabecera en la tabla INGRESO verificando el valor exacto del ENUM estado ('procesado') y 
-- restando la fecha del documento a la fecha actual del sistema para validar que superen los 365 días[cite: 1]. 
-- La eliminación se propagará a los renglones asociados de forma transparente gracias a la restricción fk_renglon_ingreso_cabecera 
-- en RENGLON_INGRESO, la cual está configurada con ON DELETE CASCADE[cite: 2].


-- D6 - Borrar los clientes socios sin compras que viven en una localidad específica.

BEGIN;
SELECT 
    c.id_cliente, 
    c.nombre_razon, 
    c.codigo_postal,
    l.nombre AS localidad
FROM CLIENTE c
JOIN SOCIO_CLUB sc ON c.id_cliente = sc.id_cliente
JOIN LOCALIDAD l ON c.codigo_postal = l.codigo_postal
WHERE l.nombre = 'San Rafael' -- Localidad que se quiera elegir
  AND NOT EXISTS (
      SELECT 1 FROM COMPROBANTE comp WHERE comp.id_cliente = c.id_cliente
  );

DELETE FROM CLIENTE c
USING SOCIO_CLUB sc, LOCALIDAD l
WHERE c.id_cliente = sc.id_cliente
  AND c.codigo_postal = l.codigo_postal
  AND l.nombre = 'San Rafael' 
  AND NOT EXISTS (
      SELECT 1 FROM COMPROBANTE comp WHERE comp.id_cliente = c.id_cliente
  );
  
SELECT 
    c.id_cliente, 
    c.nombre_razon, 
    c.codigo_postal,
    l.nombre AS localidad
FROM CLIENTE c
JOIN SOCIO_CLUB sc ON c.id_cliente = sc.id_cliente
JOIN LOCALIDAD l ON c.codigo_postal = l.codigo_postal
WHERE l.nombre = 'San Rafael'
  AND NOT EXISTS (
      SELECT 1 FROM COMPROBANTE comp WHERE comp.id_cliente = c.id_cliente
  );
ROLLBACK;
-- Se utiliza la cláusula USING en el DELETE para cruzar la superclase CLIENTE con la subclase SOCIO_CLUB y con la tabla 
-- LOCALIDAD, permitiendo filtrar por el nombre del parámetro[cite: 1]. La ausencia de compras se verifica eficientemente 
-- mediante NOT EXISTS sobre la tabla COMPROBANTE[cite: 1]. Al borrar de la superclase, el registro en SOCIO_CLUB se elimina 
-- automáticamente gracias a la restricción fk_socio_club_cliente configurada con ON DELETE CASCADE[cite: 2].