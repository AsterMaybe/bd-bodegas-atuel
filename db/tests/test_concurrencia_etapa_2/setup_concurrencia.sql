-- =============================================================================
-- Setup para prueba de concurrencia (Etapa 2, Paso 8)
-- Deja exactamente 1 botella de vino 9001 en sala 901.
-- Autónomo: crea todos los catálogos mínimos necesarios.
-- =============================================================================

-- Limpieza suave de datos previos de prueba (ignorar errores si no existen)
DELETE FROM stock_sala WHERE id_sala = 901 AND codigo_vino = 9001;
DELETE FROM vino WHERE codigo_vino = 9001;
DELETE FROM sala_venta WHERE id_sala = 901;
DELETE FROM localidad WHERE codigo_postal = '5600';
DELETE FROM bodega WHERE cuit = '30700000018';
DELETE FROM personal WHERE cuit = '20300000019';
DELETE FROM departamento WHERE id_depto = 900;

-- Departamento
INSERT INTO departamento (id_depto, nombre_depto, provincia)
VALUES (900, 'San Rafael', 'Mendoza');

-- Bodega
INSERT INTO bodega (cuit, razon_social, domicilio)
VALUES ('30700000018', 'Bodega Valle del Atuel S.A.', 'Ruta Nacional 143 Km 520');

-- Encargado / Personal
INSERT INTO personal (cuit, nombre, fecha_ingreso, salario)
VALUES ('20300000019', 'Juan Pérez (Encargado Regional)', '2018-03-01', 950000.00);
INSERT INTO encargado (cuit) VALUES ('20300000019');

-- Localidad
INSERT INTO localidad (codigo_postal, provincia, nombre, cuit_encargado)
VALUES ('5600', 'Mendoza', 'San Rafael', '20300000019');

-- Sala de venta 901
INSERT INTO sala_venta (id_sala, numero, calle, dia_de_cierre, codigo_postal)
VALUES (901, 450, 'Av. Hipólito Yrigoyen', 1, '5600');

-- Vino 9001
INSERT INTO vino (codigo_vino, nombre, tipo, añada, volumen_ml, graduacion, precio, cuit_bodega)
VALUES (9001, 'Atuel Malbec Reserva', 'tinto', 2021, 750, 14.00, 12500.00, '30700000018');

-- Cliente 9001 (necesario para los comprobantes de prueba)
INSERT INTO cliente (id_cliente, nombre_razon, tipo_doc, nro_doc, direccion, fecha_alta, descuento, codigo_postal)
VALUES (9001, 'Cliente Prueba Concurrencia', 'DNI', '38111222', 'Calle Falsa 123', CURRENT_DATE, 0, '5600');

-- Stock: exactamente 1 botella
INSERT INTO stock_sala (id_sala, codigo_vino, cantidad)
VALUES (901, 9001, 1);

-- Verificación
SELECT id_sala, codigo_vino, cantidad AS stock_inicial
  FROM stock_sala
 WHERE id_sala = 901 AND codigo_vino = 9001;
