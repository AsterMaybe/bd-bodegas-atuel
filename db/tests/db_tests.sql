
-- Propósito:
--   Verificar el cumplimiento de las reglas de negocio RN-01 a RN-15 mediante
--   casos que deben funcionar (éxito) y casos que deben fallar (rechazo).
--   En psql, cada sentencia fuera de un bloque BEGIN...COMMIT corre en modo
--   autocommit: las sentencias inválidas emiten el ERROR esperado, revierten su
--   propio cambio y permiten que el script continúe con la siguiente prueba.
-- =============================================================================

-- =============================================================================
-- PREPARACIÓN DE CATÁLOGOS BASE PARA LAS PRUEBAS
-- 
INSERT INTO DEPARTAMENTO (id_depto, nombre_depto, provincia)
VALUES (900, 'San Rafael', 'Mendoza');

INSERT INTO PERSONAL (cuit, nombre, fecha_ingreso, salario) VALUES
('20300000019', 'Juan Pérez (Encargado Regional)', '2018-03-01', 950000.00),
('20300000027', 'Carlos Gómez (Empleado Sala)',    '2022-05-10', 620000.00);

INSERT INTO ENCARGADO (cuit)
VALUES ('20300000019');

INSERT INTO LOCALIDAD (codigo_postal, provincia, nombre, cuit_encargado)
VALUES ('5600', 'Mendoza', 'San Rafael', '20300000019');

INSERT INTO BODEGA (cuit, razon_social, domicilio)
VALUES ('30700000018', 'Bodega Valle del Atuel S.A.', 'Ruta Nacional 143 Km 520');

INSERT INTO CEPA (id_cepa, nombre, tipo) VALUES
(901, 'Malbec',             'tinta'),
(902, 'Cabernet Sauvignon', 'tinta');

INSERT INTO TRANSPORTISTA (codigo, razon_social, cuit, email, telefono, domicilio)
VALUES (900, 'Logística Andina S.R.L.', '30710000015', 'contacto@andina.com.ar', '2604421000', 'Av. Mitre 1250');


-- =============================================================================
-- PRUEBAS RN-01: El precio de un vino es único para toda la red de salas y
--                siempre mayor que cero (Atributo en VINO + CHECK precio > 0).
-- =============================================================================

-- [RN-01 | CASO QUE DEBE FUNCIONAR]
-- Alta de un vino con precio único positivo ($12.500,00) y su composición 100%.
BEGIN;
INSERT INTO VINO (codigo_vino, nombre, tipo, añada, volumen_ml, graduacion, precio, cuit_bodega)
VALUES (9001, 'Atuel Malbec Reserva', 'tinto', 2021, 750, 14.00, 12500.00, '30700000018');

INSERT INTO COMPOSICION_VINO (codigo_vino, id_cepa, porcentaje)
VALUES (9001, 901, 100.00);
COMMIT;

-- [RN-01 | CASO QUE DEBE FALLAR]
-- Error esperado: SQLSTATE 23514 (check_violation) - El precio del vino debe ser mayor que cero (precio > 0).
INSERT INTO VINO (codigo_vino, nombre, tipo, añada, volumen_ml, graduacion, precio, cuit_bodega)
VALUES (9099, 'Vino Precio Inválido', 'tinto', 2022, 750, 13.50, 0.00, '30700000018');


-- =============================================================================
-- PRUEBAS RN-02: Una sala pertenece a una sola localidad. Cada localidad tiene
--                un único encargado regional (FK + diseño normalizado en 3FN).
-- =============================================================================

-- [RN-02 | CASO QUE DEBE FUNCIONAR]
-- Dos salas ubicadas en la misma localidad ('5600') comparten el único encargado regional de dicha localidad.
INSERT INTO SALA_VENTA (id_sala, numero, calle, dia_de_cierre, codigo_postal) VALUES
(901, 450,  'Av. Hipólito Yrigoyen', 1, '5600'),
(902, 1120, 'Av. San Martín',        3, '5600');

-- [RN-02 | CASO QUE DEBE FALLAR 1]
-- Error esperado: SQLSTATE 23503 (foreign_key_violation) - La localidad '9999' no existe en LOCALIDAD.
INSERT INTO SALA_VENTA (id_sala, numero, calle, dia_de_cierre, codigo_postal)
VALUES (903, 100, 'Calle Inexistente', 2, '9999');

-- [RN-02 | CASO QUE DEBE FALLAR 2]
-- Error esperado: SQLSTATE 23503 (foreign_key_violation) - El CUIT del encargado no existe en ENCARGADO.
INSERT INTO LOCALIDAD (codigo_postal, provincia, nombre, cuit_encargado)
VALUES ('5620', 'Mendoza', 'General Alvear', '20999999999');


-- =============================================================================
-- PRUEBAS RN-03: Cada empleado trabaja en una sola sala (PK cuit + FK NOT NULL).
-- =============================================================================

-- [RN-03 | CASO QUE DEBE FUNCIONAR]
-- Asignación del empleado '20300000027' a una única sala de venta (901).
INSERT INTO EMPLEADO (cuit, id_sala)
VALUES ('20300000027', 901);

-- [RN-03 | CASO QUE DEBE FALLAR 1]
-- Error esperado: SQLSTATE 23505 (unique_violation) - El empleado ya está asignado a una sala y no puede figurar en dos.
INSERT INTO EMPLEADO (cuit, id_sala)
VALUES ('20300000027', 902);

-- [RN-03 | CASO QUE DEBE FALLAR 2]
-- Error esperado: SQLSTATE 23502 (not_null_violation) - Un empleado debe tener sala asignada obligatoriamente.
INSERT INTO EMPLEADO (cuit, id_sala)
VALUES ('20300000019', NULL);


-- =============================================================================
-- PRUEBAS RN-04: Una parcela tiene una sola cepa y se cosecha como máximo una
--                vez por campaña (FK id_cepa + UNIQUE (nro_parcela, id_finca, campaña)).
-- =============================================================================

-- [RN-04 | CASO QUE DEBE FUNCIONAR]
-- Creación de finca, parcela con una única cepa (901) y registro de su cosecha en la campaña 2025.
INSERT INTO FINCA (id_finca, nombre, superficie_ha, id_depto)
VALUES (901, 'Finca Los Maitenes', 45.00, 900);

INSERT INTO PARCELA (nro_parcela, id_finca, superficie, año_plantacion, id_cepa)
VALUES (1, 901, 12.50, 2015, 901);

INSERT INTO LOTE_UVA (nro_lote, campaña, fecha_cosecha, kg, nro_parcela, id_finca, cuit_bodega)
VALUES (9001, 2025, '2025-03-15', 18500.00, 1, 901, '30700000018');

-- [RN-04 | CASO QUE DEBE FALLAR]
-- Error esperado: SQLSTATE 23505 (unique_violation) - La parcela (1, 901) ya fue cosechada en la campaña 2025.
INSERT INTO LOTE_UVA (nro_lote, campaña, fecha_cosecha, kg, nro_parcela, id_finca, cuit_bodega)
VALUES (9002, 2025, '2025-04-02', 9200.00, 1, 901, '30700000018');


-- =============================================================================
-- PRUEBAS RN-05: Los porcentajes de corte de un vino suman exactamente 100
--                (CONSTRAINT TRIGGER DEFERRABLE INITIALLY DEFERRED).
-- =============================================================================

-- [RN-05 | CASO QUE DEBE FUNCIONAR]
-- Alta de un vino Bivarietal cuyos porcentajes (85% Malbec + 15% Cabernet Sauvignon) suman 100% al confirmar la transacción.
BEGIN;
INSERT INTO VINO (codigo_vino, nombre, tipo, añada, volumen_ml, graduacion, precio, cuit_bodega)
VALUES (9002, 'Atuel Corte Selección', 'tinto', 2022, 750, 14.50, 16000.00, '30700000018');

INSERT INTO COMPOSICION_VINO (codigo_vino, id_cepa, porcentaje)
VALUES (9002, 901, 85.00);

INSERT INTO COMPOSICION_VINO (codigo_vino, id_cepa, porcentaje)
VALUES (9002, 902, 15.00);
COMMIT;

-- [RN-05 | CASO QUE DEBE FALLAR]
-- Error esperado al ejecutar COMMIT: SQLSTATE P0001 (raise_exception) -
-- "La suma de los porcentajes de corte del vino 9003 es 80.00%, pero debe ser exactamente 100.00% (RN-05)".
BEGIN;
INSERT INTO VINO (codigo_vino, nombre, tipo, añada, volumen_ml, graduacion, precio, cuit_bodega)
VALUES (9003, 'Vino Corte Incompleto', 'tinto', 2023, 750, 13.80, 11000.00, '30700000018');

INSERT INTO COMPOSICION_VINO (codigo_vino, id_cepa, porcentaje)
VALUES (9003, 901, 60.00);

INSERT INTO COMPOSICION_VINO (codigo_vino, id_cepa, porcentaje)
VALUES (9003, 902, 20.00);
COMMIT;


-- =============================================================================
-- PRUEBAS RN-06: El descuento depende del tipo de cliente: socio 10%,
--                distribuidor 20%, exportador 30% (Función + CHECK de rango).
-- =============================================================================

-- [RN-06 | CASO QUE DEBE FUNCIONAR]
-- Alta de un cliente de cada subtipo con su porcentaje correspondiente.
INSERT INTO CLIENTE (id_cliente, nombre_razon, tipo_doc, nro_doc, direccion, fecha_alta, descuento, codigo_postal) VALUES
(9001, 'Martín López',             'DNI',  '38111222', 'Las Heras 340',    CURRENT_DATE, 10.00, '5600'),
(9002, 'Distribuidora Cuyana SA',  'CUIT', '30712223334', 'Balloffet 890', CURRENT_DATE, 20.00, '5600'),
(9003, 'Andes Wine Exports LLC',   'CUIT', '30714445556', 'Av. Libertador 50', CURRENT_DATE, 30.00, '5600');

INSERT INTO SOCIO_CLUB (id_cliente) VALUES (9001);
INSERT INTO DISTRIBUIDOR (id_cliente, zona_cobertura, nro_habilitacion) VALUES (9002, 'Sur de Mendoza', 'HAB-9002');
INSERT INTO EXPORTADOR (id_cliente, pais_destino) VALUES (9003, 'Estados Unidos');

-- [RN-06 | CASO QUE DEBE FALLAR]
-- Error esperado: SQLSTATE 23514 (check_violation) - El porcentaje de descuento excede el rango válido para clientes.
INSERT INTO CLIENTE (id_cliente, nombre_razon, tipo_doc, nro_doc, direccion, fecha_alta, descuento, codigo_postal)
VALUES (9099, 'Cliente Descuento Ilegal', 'DNI', '99888777', 'Sin Calle 123', CURRENT_DATE, 75.00, '5600');


-- =============================================================================
-- PRUEBAS RN-07: Un exportador puede tener varios permisos; el vencimiento es
--                posterior a la emisión (Tabla PERMISO_EXPORTADOR + CHECK).
-- =============================================================================

-- [RN-07 | CASO QUE DEBE FUNCIONAR]
-- Registro de dos permisos vigentes para el mismo exportador (9003) con fecha_venc > fecha_emision.
INSERT INTO PERMISO_EXPORTADOR (codigo_permiso, fecha_emision, fecha_venc, id_cliente) VALUES
('PERM-2026-001', '2026-01-15', '2026-12-31', 9003),
('PERM-2026-002', '2026-03-01', '2027-03-01', 9003);

-- [RN-07 | CASO QUE DEBE FALLAR]
-- Error esperado: SQLSTATE 23514 (check_violation) - La fecha de vencimiento ('2026-02-01') no es posterior a la emisión ('2026-05-01').
INSERT INTO PERMISO_EXPORTADOR (codigo_permiso, fecha_emision, fecha_venc, id_cliente)
VALUES ('PERM-INVALIDO', '2026-05-01', '2026-02-01', 9003);


-- =============================================================================
-- PRUEBAS RN-08 y RN-09:
--   RN-08: El total del comprobante es la suma de sus renglones con el descuento
--          aplicado. No se carga a mano (Función de cálculo + Trigger).
--   RN-09: No se puede vender más de lo que hay en stock de la sala. El stock
--          nunca es negativo (Trigger BEFORE INSERT + CHECK cantidad >= 0).
-- =============================================================================

-- Carga inicial de 20 botellas del vino 9001 en la sala 901 para probar ventas:
INSERT INTO STOCK_SALA (id_sala, codigo_vino, cantidad)
VALUES (901, 9001, 20);

-- [RN-08 y RN-09 | CASO QUE DEBE FUNCIONAR]
-- Se crea un comprobante en cero para el socio 9001 (10% dto.) en la sala 901 y se vende 2 botellas del vino 9001 ($12.500 c/u).
-- Aunque se envíen importes manuales falsos (1.00) en el renglón, el trigger BEFORE INSERT calcula precio_unitario = 12500.00,
-- descuento = 2500.00 y subtotal = 22500.00; y el trigger AFTER INSERT descuenta el stock a 18 y actualiza el comprobante.
INSERT INTO COMPROBANTE (nro_comprob, fecha, subtotal, descuento, total, id_cliente, id_sala)
VALUES (9001, CURRENT_TIMESTAMP, 0.00, 0.00, 0.00, 9001, 901);

INSERT INTO RENGLON_COMPROBANTE (nro_comprob, codigo_vino, cantidad, precio_unitario, descuento, subtotal)
VALUES (9001, 9001, 2, 1.00, 0.00, 1.00);

-- Verificación de estado tras el éxito (debe mostrar subtotal=25000.00, descuento=2500.00, total=22500.00 y stock=18):
SELECT nro_comprob, subtotal, descuento, total FROM COMPROBANTE WHERE nro_comprob = 9001;
SELECT id_sala, codigo_vino, cantidad AS stock_restante FROM STOCK_SALA WHERE id_sala = 901 AND codigo_vino = 9001;

-- [RN-09 | CASO QUE DEBE FALLAR 1: Venta mayor al stock disponible en la sala]
-- Error esperado: SQLSTATE P0001 (raise_exception) -
-- "Stock insuficiente del vino 9002 en la sala 901 (stock disponible: 0, solicitado: 5) (RN-09)".
INSERT INTO RENGLON_COMPROBANTE (nro_comprob, codigo_vino, cantidad, precio_unitario, descuento, subtotal)
VALUES (9001, 9002, 5, 16000.00, 0.00, 80000.00);

-- [RN-09 | CASO QUE DEBE FALLAR 2: Stock negativo directo en STOCK_SALA]
-- Error esperado: SQLSTATE 23514 (check_violation) - La cantidad en stock nunca puede ser negativa (cantidad >= 0).
UPDATE STOCK_SALA
   SET cantidad = -5
 WHERE id_sala = 901 AND codigo_vino = 9001;


-- =============================================================================
-- PRUEBAS RN-10: Sólo un ingreso terminado impacta en el depósito y pasa a
--                procesado. Las transiciones son en_confeccion -> terminado ->
--                procesado y no retroceden (ENUM + Trigger + Procedimiento).
-- =============================================================================

-- [RN-10 | CASO QUE DEBE FUNCIONAR]
-- Circuito completo de ingreso: alta en 'en_confeccion', carga de renglones, paso a 'terminado' y procesamiento con sp_procesar_ingreso.
INSERT INTO INGRESO (id_documento, fecha, estado, cuit_bodega, codigo_transp)
VALUES (9001, CURRENT_DATE, 'en_confeccion', '30700000018', 900);

INSERT INTO RENGLON_INGRESO (id_documento, codigo_vino, cantidad) VALUES
(9001, 9001, 100),
(9001, 9002, 40);

UPDATE INGRESO SET estado = 'terminado' WHERE id_documento = 9001;

CALL sp_procesar_ingreso(9001);

-- Verificación (debe mostrar estado = 'procesado' y stock en depósito de 100 y 40 botellas):
SELECT id_documento, estado FROM INGRESO WHERE id_documento = 9001;
SELECT codigo_vino, cantidad FROM STOCK_DEPOSITO WHERE codigo_vino IN (9001, 9002);

-- [RN-10 | CASO QUE DEBE FALLAR 1: Intentar retroceder de 'procesado' a 'terminado']
-- Error esperado: SQLSTATE P0001 (raise_exception) -
-- "Transición de estado inválida en ingreso (documento 9001): no se puede pasar de procesado a terminado (RN-10)".
UPDATE INGRESO SET estado = 'terminado' WHERE id_documento = 9001;

-- [RN-10 | CASO QUE DEBE FALLAR 2: Intentar procesar un ingreso que sigue 'en_confeccion']
-- Error esperado: SQLSTATE P0001 (raise_exception) - El ingreso 9002 no está en estado 'terminado' (RN-10).
INSERT INTO INGRESO (id_documento, fecha, estado, cuit_bodega, codigo_transp)
VALUES (9002, CURRENT_DATE, 'en_confeccion', '30700000018', 900);

CALL sp_procesar_ingreso(9002);


-- =============================================================================
-- PRUEBAS RN-11: Igual que RN-10 para transferencias. La fecha de confección es
--                la actual y no se puede modificar (Triggers + Procedimiento).
-- =============================================================================

-- [RN-11 | CASO QUE DEBE FUNCIONAR]
-- Se inserta la transferencia 9001 enviando una fecha pasada ('2020-01-01'): el trigger fuerza CURRENT_DATE.
-- Luego se carga un renglón de 30 botellas del vino 9001, se pasa a 'terminado' y se procesa con sp_procesar_transferencia.
INSERT INTO TRANSFERENCIA (id_documento, fecha, estado, id_sala)
VALUES (9001, '2020-01-01', 'en_confeccion', 901);

INSERT INTO RENGLON_TRANSFERENCIA (id_documento, codigo_vino, cantidad)
VALUES (9001, 9001, 30);

UPDATE TRANSFERENCIA SET estado = 'terminado' WHERE id_documento = 9001;

CALL sp_procesar_transferencia(9001);

-- Verificación (fecha = CURRENT_DATE, estado = 'procesado', depósito bajó de 100 a 70 y sala 901 subió de 18 a 48):
SELECT id_documento, fecha, estado FROM TRANSFERENCIA WHERE id_documento = 9001;
SELECT codigo_vino, cantidad AS stock_deposito FROM STOCK_DEPOSITO WHERE codigo_vino = 9001;
SELECT id_sala, codigo_vino, cantidad AS stock_sala FROM STOCK_SALA WHERE id_sala = 901 AND codigo_vino = 9001;

-- [RN-11 | CASO QUE DEBE FALLAR 1: Intentar modificar la fecha de confección de una transferencia]
-- Error esperado: SQLSTATE P0001 (raise_exception) -
-- "La fecha de confección de la transferencia 9001 no puede modificarse (RN-11)".
UPDATE TRANSFERENCIA
   SET fecha = CURRENT_DATE - 10
 WHERE id_documento = 9001;

-- [RN-11 | CASO QUE DEBE FALLAR 2: Procesar transferencia sin stock suficiente en depósito no deja cambios a medias]
-- La transferencia 9002 pide 10 botellas de 9001 (hay 70 en depósito) y 500 botellas de 9002 (solo hay 40 en depósito).
INSERT INTO TRANSFERENCIA (id_documento, fecha, estado, id_sala)
VALUES (9002, CURRENT_DATE, 'en_confeccion', 901);

INSERT INTO RENGLON_TRANSFERENCIA (id_documento, codigo_vino, cantidad) VALUES
(9002, 9001, 10),
(9002, 9002, 500);

UPDATE TRANSFERENCIA SET estado = 'terminado' WHERE id_documento = 9002;

-- Error esperado: SQLSTATE P0001 / 23514 - Stock insuficiente en depósito central para procesar la transferencia 9002 (RN-11).
CALL sp_procesar_transferencia(9002);

-- Verificación de atomicidad (el vino 9001 en depósito debe seguir intacto en 70 y la transferencia 9002 en 'terminado'):
SELECT codigo_vino, cantidad AS stock_intacto_deposito FROM STOCK_DEPOSITO WHERE codigo_vino IN (9001, 9002);
SELECT id_documento, estado AS estado_sin_cambios FROM TRANSFERENCIA WHERE id_documento = 9002;


-- =============================================================================
-- PRUEBAS RN-12: Un ingreso o una transferencia que no está en confección no
--                admite agregar, modificar ni quitar renglones (Triggers).
-- =============================================================================

-- [RN-12 | CASO QUE DEBE FUNCIONAR]
-- El ingreso 9002 sigue en estado 'en_confeccion', por lo que permite agregar y modificar renglones.
INSERT INTO RENGLON_INGRESO (id_documento, codigo_vino, cantidad)
VALUES (9002, 9001, 25);

UPDATE RENGLON_INGRESO
   SET cantidad = 30
 WHERE id_documento = 9002 AND codigo_vino = 9001;

-- [RN-12 | CASO QUE DEBE FALLAR 1: Agregar un renglón a un ingreso que ya no está en confección]
-- Error esperado: SQLSTATE P0001 (raise_exception) -
-- "No se permite INSERT renglones en el ingreso 9001 porque su estado es procesado (RN-12)".
INSERT INTO RENGLON_INGRESO (id_documento, codigo_vino, cantidad)
VALUES (9001, 9003, 10);

-- [RN-12 | CASO QUE DEBE FALLAR 2: Eliminar un renglón de una transferencia en estado 'terminado']
-- Error esperado: SQLSTATE P0001 (raise_exception) -
-- "No se permite DELETE renglones en la transferencia 9002 porque su estado es terminado (RN-12)".
DELETE FROM RENGLON_TRANSFERENCIA
 WHERE id_documento = 9002 AND codigo_vino = 9002;


-- =============================================================================
-- PRUEBAS RN-13: Todo cambio de precio de un vino queda auditado (fecha,
--                usuario, precio anterior y nuevo) (Trigger AFTER UPDATE).
-- =============================================================================

-- [RN-13 | CASO QUE DEBE FUNCIONAR]
-- Actualización del precio del vino 9001 de $12.500,00 a $14.200,00 y consulta de la fila generada en AUDITORIA_PRECIO.
UPDATE VINO
   SET precio = 14200.00
 WHERE codigo_vino = 9001;

SELECT id_auditoria, codigo_vino, precio_anterior, precio_nuevo, fecha_hora, usuario
  FROM AUDITORIA_PRECIO
 WHERE codigo_vino = 9001;

-- [RN-13 | CASO QUE DEBE FALLAR]
-- Error esperado: SQLSTATE 23503 (foreign_key_violation) al intentar registrar auditoría sobre un vino inexistente
-- (o SQLSTATE 42501 insufficient_privilege si el rol app_rw intenta ejecutar DELETE/UPDATE sobre AUDITORIA_PRECIO).
INSERT INTO AUDITORIA_PRECIO (precio_anterior, precio_nuevo, fecha_hora, usuario, codigo_vino)
VALUES (10000.00, 12000.00, CURRENT_TIMESTAMP, CURRENT_USER, 99999);


-- =============================================================================
-- PRUEBAS RN-14: No se puede borrar un transportista, una bodega ni un vino
--                que tengan movimientos asociados (FK con ON DELETE RESTRICT).
-- =============================================================================

-- [RN-14 | CASO QUE DEBE FUNCIONAR]
-- Creación y borrado de un transportista sin ingresos ni coberturas asociadas.
INSERT INTO TRANSPORTISTA (codigo, razon_social, cuit, email, telefono, domicilio)
VALUES (999, 'Transporte Temporal SA', '30799999991', 'temp@transporte.com', '2604000000', 'Calle 1');

DELETE FROM TRANSPORTISTA WHERE codigo = 999;

-- [RN-14 | CASO QUE DEBE FALLAR 1: Borrar transportista con ingresos asociados]
-- Error esperado: SQLSTATE 23503 (foreign_key_violation / restrict_violation) - El transportista 900 tiene ingresos en INGRESO.
DELETE FROM TRANSPORTISTA WHERE codigo = 900;

-- [RN-14 | CASO QUE DEBE FALLAR 2: Borrar bodega con vinos/lotes/ingresos asociados]
-- Error esperado: SQLSTATE 23503 (foreign_key_violation / restrict_violation) - La bodega tiene registros dependientes.
DELETE FROM BODEGA WHERE cuit = '30700000018';

-- [RN-14 | CASO QUE DEBE FALLAR 3: Borrar vino con movimientos de venta, ingreso y transferencia]
-- Error esperado: SQLSTATE 23503 (foreign_key_violation / restrict_violation) - El vino 9001 tiene movimientos asociados.
DELETE FROM VINO WHERE codigo_vino = 9001;


-- =============================================================================
-- PRUEBAS RN-15: Cantidades, superficies, kilos y precios son siempre positivos.
--                La graduación está entre 5 y 20 (CHECK).
-- =============================================================================

-- [RN-15 | CASO QUE DEBE FUNCIONAR]
-- Registro de análisis de calidad y verificación de que las superficies, kilos y graduaciones válidas anteriores fueron aceptadas.
INSERT INTO ANALISIS_CALIDAD (id_analisis, fecha, brix, ph, acidez, nro_lote)
VALUES (9001, CURRENT_TIMESTAMP, 24.50, 3.65, 5.80, 9001);

-- [RN-15 | CASO QUE DEBE FALLAR 1: Graduación alcohólica fuera del rango 5 a 20]
-- Error esperado: SQLSTATE 23514 (check_violation) - La graduación (24.50) viola CHECK (graduacion BETWEEN 5 AND 20).
INSERT INTO VINO (codigo_vino, nombre, tipo, añada, volumen_ml, graduacion, precio, cuit_bodega)
VALUES (9098, 'Vino Graduación Excesiva', 'tinto', 2023, 750, 24.50, 9500.00, '30700000018');

-- [RN-15 | CASO QUE DEBE FALLAR 2: Superficie de finca no positiva]
-- Error esperado: SQLSTATE 23514 (check_violation) - La superficie_ha (-15.00) debe ser mayor que cero.
INSERT INTO FINCA (id_finca, nombre, superficie_ha, id_depto)
VALUES (999, 'Finca Superficie Negativa', -15.00, 900);

-- [RN-15 | CASO QUE DEBE FALLAR 3: Kilos cosechados no positivos en LOTE_UVA]
-- Error esperado: SQLSTATE 23514 (check_violation) - Los kilos cosechados (0.00) deben ser mayores que cero.
INSERT INTO LOTE_UVA (nro_lote, campaña, fecha_cosecha, kg, nro_parcela, id_finca, cuit_bodega)
VALUES (9099, 2026, '2026-03-10', 0.00, 1, 901, '30700000018');

-- [RN-15 | CASO QUE DEBE FALLAR 4: Cantidad de botellas no positiva en renglón de ingreso]
-- Error esperado: SQLSTATE 23514 (check_violation) - La cantidad (-10) debe ser mayor que cero.
INSERT INTO RENGLON_INGRESO (id_documento, codigo_vino, cantidad)
VALUES (9002, 9002, -10);