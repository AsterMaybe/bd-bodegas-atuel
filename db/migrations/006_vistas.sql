
-- VISTA 1: Stock total por vino (vw_stock_total_vino)
-- Propósito:
--   Consolidar para cada vino del catálogo las unidades disponibles en el
--   depósito central, la suma distribuida en todas las salas de venta y el
--   stock global de la empresa (insumo directo para reportes y consulta S9).

CREATE OR REPLACE VIEW vw_stock_total_vino AS
SELECT
    v.codigo_vino,
    v.nombre                                              AS nombre_vino,
    v.tipo                                                AS tipo_vino,
    v.añada,
    v.volumen_ml,
    v.graduacion,
    v.precio,
    b.cuit                                                AS cuit_bodega,
    b.razon_social                                        AS bodega_elaboradora,
    COALESCE(sd.cantidad, 0)                              AS stock_deposito,
    COALESCE(ss.stock_salas, 0)                           AS stock_total_salas,
    COALESCE(sd.cantidad, 0) + COALESCE(ss.stock_salas, 0) AS stock_global
FROM VINO v
JOIN BODEGA b
  ON b.cuit = v.cuit_bodega
LEFT JOIN STOCK_DEPOSITO sd
  ON sd.codigo_vino = v.codigo_vino
LEFT JOIN (
    SELECT
        codigo_vino,
        SUM(cantidad)::INTEGER AS stock_salas
    FROM STOCK_SALA
    GROUP BY codigo_vino
) ss
  ON ss.codigo_vino = v.codigo_vino;

-- -----------------------------------------------------------------------
-- VISTA 2: Ventas mensuales por sala (vw_ventas_mensuales_sala)
-- Propósito:
--   Resumir por sala de venta y período mensual (año-mes) la cantidad de
--   comprobantes emitidos, el total de botellas vendidas, el importe bruto,
--   los descuentos otorgados y la facturación neta total (insumo para S11).

CREATE OR REPLACE VIEW vw_ventas_mensuales_sala AS
SELECT
    sv.id_sala,
    sv.calle || ' ' || sv.numero             AS direccion_sala,
    l.codigo_postal,
    l.nombre                                 AS localidad,
    l.provincia,
    DATE_TRUNC('month', c.fecha)::DATE       AS periodo_mes,
    COUNT(c.nro_comprob)                     AS cantidad_comprobantes,
    COALESCE(SUM(rc.botellas_comprob), 0)    AS botellas_vendidas,
    SUM(c.subtotal)                          AS monto_bruto,
    SUM(c.descuento)                         AS monto_descuento,
    SUM(c.total)                             AS monto_neto_total
FROM COMPROBANTE c
JOIN SALA_VENTA sv
  ON sv.id_sala = c.id_sala
JOIN LOCALIDAD l
  ON l.codigo_postal = sv.codigo_postal
LEFT JOIN (
    SELECT
        nro_comprob,
        SUM(cantidad) AS botellas_comprob
    FROM RENGLON_COMPROBANTE
    GROUP BY nro_comprob
) rc
  ON rc.nro_comprob = c.nro_comprob
GROUP BY
    sv.id_sala,
    sv.calle,
    sv.numero,
    l.codigo_postal,
    l.nombre,
    l.provincia,
    DATE_TRUNC('month', c.fecha)::DATE;


-- -----------------------------------------------------------------------------
-- VISTA MATERIALIZADA (Opcional sugerida en Etapa 2): mv_ventas_mensuales_sala
-- Propósito:
--   Persistir en disco la agregación histórica mensual por sala para acelerar
--   consultas analíticas y tableros sobre volúmenes mayores a 500.000 renglones.

CREATE MATERIALIZED VIEW mv_ventas_mensuales_sala AS
SELECT *
FROM vw_ventas_mensuales_sala
WITH DATA;


-- -----------------------------------------------------------------------------
-- VISTA 3: Documentos pendientes de procesamiento (vw_documentos_pendientes)
-- Propósito:
--   Unificar todos los documentos logísticos (INGRESO y TRANSFERENCIA) que aún
--   no impactaron en el stock (estados 'en_confeccion' o 'terminado'), junto
--   con su origen/destino, cantidad de variedades de vino y total de botellas.

CREATE OR REPLACE VIEW vw_documentos_pendientes AS
SELECT
    'INGRESO'::VARCHAR(15)                   AS tipo_documento,
    i.id_documento,
    i.fecha,
    i.estado,
    'Bodega: ' || b.razon_social || ' (Transp.: ' || t.razon_social || ')' AS origen_destino,
    COUNT(ri.codigo_vino)                    AS cantidad_renglones,
    COALESCE(SUM(ri.cantidad), 0)            AS total_botellas
FROM INGRESO i
JOIN BODEGA b
  ON b.cuit = i.cuit_bodega
JOIN TRANSPORTISTA t
  ON t.codigo = i.codigo_transp
LEFT JOIN RENGLON_INGRESO ri
  ON ri.id_documento = i.id_documento
WHERE i.estado <> 'procesado'
GROUP BY
    i.id_documento,
    i.fecha,
    i.estado,
    b.razon_social,
    t.razon_social

UNION ALL

SELECT
    'TRANSFERENCIA'::VARCHAR(15)             AS tipo_documento,
    tr.id_documento,
    tr.fecha,
    tr.estado,
    'Sala #' || sv.id_sala || ' - ' || sv.calle || ' ' || sv.numero || ' (' || l.nombre || ')' AS origen_destino,
    COUNT(rt.codigo_vino)                    AS cantidad_renglones,
    COALESCE(SUM(rt.cantidad), 0)            AS total_botellas
FROM TRANSFERENCIA tr
JOIN SALA_VENTA sv
  ON sv.id_sala = tr.id_sala
JOIN LOCALIDAD l
  ON l.codigo_postal = sv.codigo_postal
LEFT JOIN RENGLON_TRANSFERENCIA rt
  ON rt.id_documento = tr.id_documento
WHERE tr.estado <> 'procesado'
GROUP BY
    tr.id_documento,
    tr.fecha,
    tr.estado,
    sv.id_sala,
    sv.calle,
    sv.numero,
    l.nombre;