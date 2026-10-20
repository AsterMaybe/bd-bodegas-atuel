
-- RESTRICCIONES DE INTEGRIDAD Y ACCIONES REFERENCIALES (002_constraints.sql)


-- Valida que el CUIT contenga exactamente 11 dígitos numéricos sin guiones.
ALTER DOMAIN cuit_dom
    ADD CONSTRAINT chk_cuit_dom_formato CHECK (VALUE ~ '^[0-9]{11}$');


-- Tabla: PERSONAL
-- El salario bruto debe ser siempre mayor que cero
ALTER TABLE PERSONAL
    ADD CONSTRAINT chk_personal_salario_positivo CHECK (salario > 0);


-- Tabla: ENCARGADO
-- Subtipo de PERSONAL: actualiza o elimina en cascada desde la superclase
ALTER TABLE ENCARGADO
    DROP CONSTRAINT IF EXISTS encargado_cuit_fkey,
    ADD CONSTRAINT fk_encargado_personal
        FOREIGN KEY (cuit) REFERENCES PERSONAL(cuit)
        ON DELETE CASCADE ON UPDATE CASCADE;


-- Tabla: LOCALIDAD
-- RN-02: Cada localidad tiene un único encargado regional asignado; no se permite borrar encargados activos
ALTER TABLE LOCALIDAD
    DROP CONSTRAINT IF EXISTS localidad_cuit_encargado_fkey,
    ADD CONSTRAINT fk_localidad_encargado
        FOREIGN KEY (cuit_encargado) REFERENCES ENCARGADO(cuit)
        ON DELETE RESTRICT ON UPDATE CASCADE;


-- Tabla: SALA_VENTA
-- Valida que el número de calle sea positivo y el día de cierre esté entre 1 (Lunes) y 7 (Domingo)
-- RN-02: Una sala pertenece a una sola localidad
ALTER TABLE SALA_VENTA
    ADD CONSTRAINT chk_sala_venta_numero_positivo CHECK (numero > 0),
    ADD CONSTRAINT chk_sala_venta_dia_cierre CHECK (dia_de_cierre BETWEEN 1 AND 7),
    DROP CONSTRAINT IF EXISTS sala_venta_codigo_postal_fkey,
    ADD CONSTRAINT fk_sala_venta_localidad
        FOREIGN KEY (codigo_postal) REFERENCES LOCALIDAD(codigo_postal)
        ON DELETE RESTRICT ON UPDATE CASCADE;


-- Tabla: EMPLEADO
-- RN-03: Cada empleado trabaja en una sola sala y hereda de PERSONAL
ALTER TABLE EMPLEADO
    DROP CONSTRAINT IF EXISTS empleado_cuit_fkey,
    ADD CONSTRAINT fk_empleado_personal
        FOREIGN KEY (cuit) REFERENCES PERSONAL(cuit)
        ON DELETE CASCADE ON UPDATE CASCADE,
    DROP CONSTRAINT IF EXISTS empleado_id_sala_fkey,
    ADD CONSTRAINT fk_empleado_sala_venta
        FOREIGN KEY (id_sala) REFERENCES SALA_VENTA(id_sala)
        ON DELETE RESTRICT ON UPDATE CASCADE;


-- Tabla: CEPA
-- El nombre de la cepa (ej. Malbec, Syrah) no puede repetirse en el catálogo
ALTER TABLE CEPA
    ADD CONSTRAINT uq_cepa_nombre UNIQUE (nombre);


-- Tabla: TRANSPORTISTA
-- El CUIT de facturación de cada empresa transportista debe ser único
ALTER TABLE TRANSPORTISTA
    ADD CONSTRAINT uq_transportista_cuit UNIQUE (cuit);


-- Tabla: TRANSPORTISTA_LOCALIDAD
-- Relación N:M de cobertura geográfica por transportista
ALTER TABLE TRANSPORTISTA_LOCALIDAD
    DROP CONSTRAINT IF EXISTS transportista_localidad_codigo_transp_fkey,
    ADD CONSTRAINT fk_transp_loc_transportista
        FOREIGN KEY (codigo_transp) REFERENCES TRANSPORTISTA(codigo)
        ON DELETE CASCADE ON UPDATE CASCADE,
    DROP CONSTRAINT IF EXISTS transportista_localidad_codigo_postal_fkey,
    ADD CONSTRAINT fk_transp_loc_localidad
        FOREIGN KEY (codigo_postal) REFERENCES LOCALIDAD(codigo_postal)
        ON DELETE RESTRICT ON UPDATE CASCADE;


-- Tabla: FINCA
-- RN-15: Las superficies en hectáreas deben ser siempre positivas
ALTER TABLE FINCA
    ADD CONSTRAINT chk_finca_superficie_positiva CHECK (superficie_ha > 0),
    DROP CONSTRAINT IF EXISTS finca_id_depto_fkey,
    ADD CONSTRAINT fk_finca_departamento
        FOREIGN KEY (id_depto) REFERENCES DEPARTAMENTO(id_depto)
        ON DELETE RESTRICT ON UPDATE CASCADE;


-- Tabla: PARCELA (Entidad Débil)
-- RN-04 y RN-15: Superficie positiva, año de plantación >= 1800, y una única cepa asignada
-- Al ser entidad débil, depende existencialmente de FINCA
ALTER TABLE PARCELA
    ADD CONSTRAINT chk_parcela_nro_positivo CHECK (nro_parcela > 0),
    ADD CONSTRAINT chk_parcela_superficie_positiva CHECK (superficie > 0),
    ADD CONSTRAINT chk_parcela_anio_plantacion CHECK (año_plantacion >= 1800),
    DROP CONSTRAINT IF EXISTS parcela_id_finca_fkey,
    ADD CONSTRAINT fk_parcela_finca
        FOREIGN KEY (id_finca) REFERENCES FINCA(id_finca)
        ON DELETE CASCADE ON UPDATE CASCADE,
    DROP CONSTRAINT IF EXISTS parcela_id_cepa_fkey,
    ADD CONSTRAINT fk_parcela_cepa
        FOREIGN KEY (id_cepa) REFERENCES CEPA(id_cepa)
        ON DELETE RESTRICT ON UPDATE CASCADE;


-- Tabla: LOTE_UVA
-- RN-04: Una parcela se cosecha como máximo una vez por campaña: UNIQUE (campaña, nro_parcela, id_finca)
-- RN-14 y RN-15: Campaña y kilos cosechados siempre positivos; prohibido borrar bodega con lotes asociados
ALTER TABLE LOTE_UVA
    ADD CONSTRAINT uq_lote_uva_campania_parcela UNIQUE (campaña, nro_parcela, id_finca),
    ADD CONSTRAINT chk_lote_uva_campania_positiva CHECK (campaña > 0),
    ADD CONSTRAINT chk_lote_uva_kg_positivos CHECK (kg > 0),
    DROP CONSTRAINT IF EXISTS lote_uva_nro_parcela_id_finca_fkey,
    ADD CONSTRAINT fk_lote_uva_parcela
        FOREIGN KEY (nro_parcela, id_finca) REFERENCES PARCELA(nro_parcela, id_finca)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    DROP CONSTRAINT IF EXISTS lote_uva_cuit_bodega_fkey,
    ADD CONSTRAINT fk_lote_uva_bodega
        FOREIGN KEY (cuit_bodega) REFERENCES BODEGA(cuit)
        ON DELETE RESTRICT ON UPDATE CASCADE;


-- Tabla: ANALISIS_CALIDAD
-- Los indicadores enológicos (grados Brix, pH y acidez total en g/L) deben ser mayores a cero
ALTER TABLE ANALISIS_CALIDAD
    ADD CONSTRAINT chk_analisis_brix_positivo CHECK (brix > 0),
    ADD CONSTRAINT chk_analisis_ph_positivo CHECK (ph > 0),
    ADD CONSTRAINT chk_analisis_acidez_positiva CHECK (acidez > 0),
    DROP CONSTRAINT IF EXISTS analisis_calidad_nro_lote_fkey,
    ADD CONSTRAINT fk_analisis_calidad_lote
        FOREIGN KEY (nro_lote) REFERENCES LOTE_UVA(nro_lote)
        ON DELETE CASCADE ON UPDATE CASCADE;


-- Tabla: VINO
-- Unicidad comercial compuesta por (nombre, añada, volumen_ml)
-- RN-01 y RN-15: Precio mayor a cero, volumen positivo y graduación alcohólica entre 5 y 20 grados
-- RN-14: No se puede eliminar una bodega que tenga vinos o movimientos asociados
ALTER TABLE VINO
    ADD CONSTRAINT uq_vino_nombre_aniada_volumen UNIQUE (nombre, añada, volumen_ml),
    ADD CONSTRAINT chk_vino_volumen_positivo CHECK (volumen_ml > 0),
    ADD CONSTRAINT chk_vino_graduacion_rango CHECK (graduacion BETWEEN 5 AND 20),
    ADD CONSTRAINT chk_vino_precio_positivo CHECK (precio > 0),
    DROP CONSTRAINT IF EXISTS vino_cuit_bodega_fkey,
    ADD CONSTRAINT fk_vino_bodega
        FOREIGN KEY (cuit_bodega) REFERENCES BODEGA(cuit)
        ON DELETE RESTRICT ON UPDATE CASCADE;


-- Tabla: COMPOSICION_VINO
-- RN-05 y RN-15: Cada porcentaje de cepa debe ser > 0 y <= 100 (la suma = 100 se valida con trigger diferido)
ALTER TABLE COMPOSICION_VINO
    ADD CONSTRAINT chk_composicion_porcentaje_rango CHECK (porcentaje > 0 AND porcentaje <= 100),
    DROP CONSTRAINT IF EXISTS composicion_vino_codigo_vino_fkey,
    ADD CONSTRAINT fk_composicion_vino
        FOREIGN KEY (codigo_vino) REFERENCES VINO(codigo_vino)
        ON DELETE CASCADE ON UPDATE CASCADE,
    DROP CONSTRAINT IF EXISTS composicion_vino_id_cepa_fkey,
    ADD CONSTRAINT fk_composicion_cepa
        FOREIGN KEY (id_cepa) REFERENCES CEPA(id_cepa)
        ON DELETE RESTRICT ON UPDATE CASCADE;


-- Tabla: VINO_MARIDAJE
-- Relación N:M entre vinos y maridajes recomendados
ALTER TABLE VINO_MARIDAJE
    DROP CONSTRAINT IF EXISTS vino_maridaje_codigo_vino_fkey,
    ADD CONSTRAINT fk_vino_maridaje_vino
        FOREIGN KEY (codigo_vino) REFERENCES VINO(codigo_vino)
        ON DELETE CASCADE ON UPDATE CASCADE,
    DROP CONSTRAINT IF EXISTS vino_maridaje_id_maridaje_fkey,
    ADD CONSTRAINT fk_vino_maridaje_maridaje
        FOREIGN KEY (id_maridaje) REFERENCES MARIDAJE(id_maridaje)
        ON DELETE RESTRICT ON UPDATE CASCADE;


-- Tabla: CLIENTE (Superclase)
-- Unicidad de documento, fecha de alta por defecto actual y RN-06: rango válido de porcentaje de descuento
ALTER TABLE CLIENTE
    ALTER COLUMN fecha_alta SET DEFAULT CURRENT_DATE,
    ALTER COLUMN descuento SET DEFAULT 0,
    ADD CONSTRAINT uq_cliente_nro_doc UNIQUE (nro_doc),
    ADD CONSTRAINT chk_cliente_descuento_rango CHECK (descuento >= 0 AND descuento <= 100),
    DROP CONSTRAINT IF EXISTS cliente_codigo_postal_fkey,
    ADD CONSTRAINT fk_cliente_localidad
        FOREIGN KEY (codigo_postal) REFERENCES LOCALIDAD(codigo_postal)
        ON DELETE RESTRICT ON UPDATE CASCADE;


-- Tabla: SOCIO_CLUB (Subclase)
-- Vinculación 1:1 con CLIENTE; borrado en cascada si se elimina el cliente base
ALTER TABLE SOCIO_CLUB
    DROP CONSTRAINT IF EXISTS socio_club_id_cliente_fkey,
    ADD CONSTRAINT fk_socio_club_cliente
        FOREIGN KEY (id_cliente) REFERENCES CLIENTE(id_cliente)
        ON DELETE CASCADE ON UPDATE CASCADE;


-- Tabla: DISTRIBUIDOR (Subclase)
-- El número de habilitación comercial / RENSPA debe ser único
ALTER TABLE DISTRIBUIDOR
    ADD CONSTRAINT uq_distribuidor_nro_habilitacion UNIQUE (nro_habilitacion),
    DROP CONSTRAINT IF EXISTS distribuidor_id_cliente_fkey,
    ADD CONSTRAINT fk_distribuidor_cliente
        FOREIGN KEY (id_cliente) REFERENCES CLIENTE(id_cliente)
        ON DELETE CASCADE ON UPDATE CASCADE;


-- Tabla: EXPORTADOR (Subclase)
-- Vinculación 1:1 con CLIENTE
ALTER TABLE EXPORTADOR
    DROP CONSTRAINT IF EXISTS exportador_id_cliente_fkey,
    ADD CONSTRAINT fk_exportador_cliente
        FOREIGN KEY (id_cliente) REFERENCES CLIENTE(id_cliente)
        ON DELETE CASCADE ON UPDATE CASCADE;


-- Tabla: PERMISO_EXPORTADOR
-- RN-07: Restricción entre columnas para garantizar que la fecha de vencimiento sea posterior a la emisión
ALTER TABLE PERMISO_EXPORTADOR
    ADD CONSTRAINT chk_permiso_fechas_validas CHECK (fecha_venc > fecha_emision),
    DROP CONSTRAINT IF EXISTS permiso_exportador_id_cliente_fkey,
    ADD CONSTRAINT fk_permiso_exportador_cliente
        FOREIGN KEY (id_cliente) REFERENCES EXPORTADOR(id_cliente)
        ON DELETE CASCADE ON UPDATE CASCADE;


-- Tabla: STOCK_DEPOSITO
-- RN-09, RN-11 y RN-14: El stock nunca puede ser negativo (inicia en 0) y no se puede borrar un vino con stock
ALTER TABLE STOCK_DEPOSITO
    ALTER COLUMN cantidad SET DEFAULT 0,
    ADD CONSTRAINT chk_stock_deposito_no_negativo CHECK (cantidad >= 0),
    DROP CONSTRAINT IF EXISTS stock_deposito_codigo_vino_fkey,
    ADD CONSTRAINT fk_stock_deposito_vino
        FOREIGN KEY (codigo_vino) REFERENCES VINO(codigo_vino)
        ON DELETE RESTRICT ON UPDATE CASCADE;


-- Tabla: STOCK_SALA
-- RN-09 y RN-14: El inventario en sucursal nunca es negativo (inicia en 0); ON DELETE RESTRICT en sala y vino
ALTER TABLE STOCK_SALA
    ALTER COLUMN cantidad SET DEFAULT 0,
    ADD CONSTRAINT chk_stock_sala_no_negativo CHECK (cantidad >= 0),
    DROP CONSTRAINT IF EXISTS stock_sala_id_sala_fkey,
    ADD CONSTRAINT fk_stock_sala_sala_venta
        FOREIGN KEY (id_sala) REFERENCES SALA_VENTA(id_sala)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    DROP CONSTRAINT IF EXISTS stock_sala_codigo_vino_fkey,
    ADD CONSTRAINT fk_stock_sala_vino
        FOREIGN KEY (codigo_vino) REFERENCES VINO(codigo_vino)
        ON DELETE RESTRICT ON UPDATE CASCADE;


-- Tabla: COMPROBANTE (Ventas)
-- RN-08: Importes inicializados en 0 para ser calculados automáticamente a partir de los renglones
ALTER TABLE COMPROBANTE
    ALTER COLUMN fecha SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN subtotal SET DEFAULT 0,
    ALTER COLUMN descuento SET DEFAULT 0,
    ALTER COLUMN total SET DEFAULT 0,
    ADD CONSTRAINT chk_comprobante_subtotal_no_negativo CHECK (subtotal >= 0),
    ADD CONSTRAINT chk_comprobante_descuento_no_negativo CHECK (descuento >= 0),
    ADD CONSTRAINT chk_comprobante_total_no_negativo CHECK (total >= 0),
    DROP CONSTRAINT IF EXISTS comprobante_id_cliente_fkey,
    ADD CONSTRAINT fk_comprobante_cliente
        FOREIGN KEY (id_cliente) REFERENCES CLIENTE(id_cliente)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    DROP CONSTRAINT IF EXISTS comprobante_id_sala_fkey,
    ADD CONSTRAINT fk_comprobante_sala_venta
        FOREIGN KEY (id_sala) REFERENCES SALA_VENTA(id_sala)
        ON DELETE RESTRICT ON UPDATE CASCADE;


-- Tabla: RENGLON_COMPROBANTE
-- RN-14 y RN-15: Cantidades, precios unitarios y subtotales > 0; descuento >= 0
-- ON DELETE CASCADE hacia la cabecera COMPROBANTE y ON DELETE RESTRICT hacia VINO
ALTER TABLE RENGLON_COMPROBANTE
    ADD CONSTRAINT chk_renglon_comp_cantidad_positiva CHECK (cantidad > 0),
    ADD CONSTRAINT chk_renglon_comp_precio_positivo CHECK (precio_unitario > 0),
    ADD CONSTRAINT chk_renglon_comp_descuento_no_negativo CHECK (descuento >= 0),
    ADD CONSTRAINT chk_renglon_comp_subtotal_positivo CHECK (subtotal > 0),
    DROP CONSTRAINT IF EXISTS renglon_comprobante_nro_comprob_fkey,
    ADD CONSTRAINT fk_renglon_comprobante_cabecera
        FOREIGN KEY (nro_comprob) REFERENCES COMPROBANTE(nro_comprob)
        ON DELETE CASCADE ON UPDATE CASCADE,
    DROP CONSTRAINT IF EXISTS renglon_comprobante_codigo_vino_fkey,
    ADD CONSTRAINT fk_renglon_comprobante_vino
        FOREIGN KEY (codigo_vino) REFERENCES VINO(codigo_vino)
        ON DELETE RESTRICT ON UPDATE CASCADE;


-- Tabla: INGRESO
-- RN-10 y RN-14: Inicia en 'en_confeccion' en la fecha actual; prohibido borrar bodegas o transportistas con ingresos
ALTER TABLE INGRESO
    ALTER COLUMN fecha SET DEFAULT CURRENT_DATE,
    ALTER COLUMN estado SET DEFAULT 'en_confeccion',
    DROP CONSTRAINT IF EXISTS ingreso_cuit_bodega_fkey,
    ADD CONSTRAINT fk_ingreso_bodega
        FOREIGN KEY (cuit_bodega) REFERENCES BODEGA(cuit)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    DROP CONSTRAINT IF EXISTS ingreso_codigo_transp_fkey,
    ADD CONSTRAINT fk_ingreso_transportista
        FOREIGN KEY (codigo_transp) REFERENCES TRANSPORTISTA(codigo)
        ON DELETE RESTRICT ON UPDATE CASCADE;


-- Tabla: RENGLON_INGRESO
-- RN-14 y RN-15: Cantidad de botellas positiva; CASCADE al borrar la cabecera INGRESO y RESTRICT en VINO
ALTER TABLE RENGLON_INGRESO
    ADD CONSTRAINT chk_renglon_ingreso_cantidad_positiva CHECK (cantidad > 0),
    DROP CONSTRAINT IF EXISTS renglon_ingreso_id_documento_fkey,
    ADD CONSTRAINT fk_renglon_ingreso_cabecera
        FOREIGN KEY (id_documento) REFERENCES INGRESO(id_documento)
        ON DELETE CASCADE ON UPDATE CASCADE,
    DROP CONSTRAINT IF EXISTS renglon_ingreso_codigo_vino_fkey,
    ADD CONSTRAINT fk_renglon_ingreso_vino
        FOREIGN KEY (codigo_vino) REFERENCES VINO(codigo_vino)
        ON DELETE RESTRICT ON UPDATE CASCADE;


-- Tabla: TRANSFERENCIA
-- RN-11: Fecha de confección por defecto actual y estado inicial 'en_confeccion'
ALTER TABLE TRANSFERENCIA
    ALTER COLUMN fecha SET DEFAULT CURRENT_DATE,
    ALTER COLUMN estado SET DEFAULT 'en_confeccion',
    DROP CONSTRAINT IF EXISTS transferencia_id_sala_fkey,
    ADD CONSTRAINT fk_transferencia_sala_venta
        FOREIGN KEY (id_sala) REFERENCES SALA_VENTA(id_sala)
        ON DELETE RESTRICT ON UPDATE CASCADE;


-- Tabla: RENGLON_TRANSFERENCIA
-- RN-14 y RN-15: Cantidad de botellas positiva; CASCADE hacia la cabecera TRANSFERENCIA y RESTRICT en VINO
ALTER TABLE RENGLON_TRANSFERENCIA
    ADD CONSTRAINT chk_renglon_transf_cantidad_positiva CHECK (cantidad > 0),
    DROP CONSTRAINT IF EXISTS renglon_transferencia_id_documento_fkey,
    ADD CONSTRAINT fk_renglon_transferencia_cabecera
        FOREIGN KEY (id_documento) REFERENCES TRANSFERENCIA(id_documento)
        ON DELETE CASCADE ON UPDATE CASCADE,
    DROP CONSTRAINT IF EXISTS renglon_transferencia_codigo_vino_fkey,
    ADD CONSTRAINT fk_renglon_transferencia_vino
        FOREIGN KEY (codigo_vino) REFERENCES VINO(codigo_vino)
        ON DELETE RESTRICT ON UPDATE CASCADE;


-- Tabla: AUDITORIA_PRECIO
-- RN-13 y RN-15: Valores por defecto de fecha/hora y usuario de BD; precios auditados > 0
ALTER TABLE AUDITORIA_PRECIO
    ALTER COLUMN fecha_hora SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN usuario SET DEFAULT CURRENT_USER,
    ADD CONSTRAINT chk_auditoria_precio_anterior_positivo CHECK (precio_anterior > 0),
    ADD CONSTRAINT chk_auditoria_precio_nuevo_positivo CHECK (precio_nuevo > 0),
    DROP CONSTRAINT IF EXISTS auditoria_precio_codigo_vino_fkey,
    ADD CONSTRAINT fk_auditoria_precio_vino
        FOREIGN KEY (codigo_vino) REFERENCES VINO(codigo_vino)
        ON DELETE RESTRICT ON UPDATE CASCADE;