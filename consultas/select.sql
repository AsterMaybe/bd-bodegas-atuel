-- CONSULTAS

-- S1 - Ranking de los 10 vinos con mayor cantidad de botellas vendidas en toda la red de salas.
EXPLAIN (ANALYZE)
SELECT 
    v.codigo_vino,
    v.nombre AS nombre_vino,
    v.añada,
    v.volumen_ml,
    SUM(rc.cantidad) AS total_botellas_vendidas
FROM VINO v
JOIN RENGLON_COMPROBANTE rc ON v.codigo_vino = rc.codigo_vino
GROUP BY 
    v.codigo_vino, 
    v.nombre,
    v.añada,
    v.volumen_ml
ORDER BY 
    total_botellas_vendidas DESC
LIMIT 10;
-- Fueron 6.4 ms de Planning Time y apenas 178.4 ms de Execution Time.
-- Hacemos un JOIN estándar (interno) entre el catálogo de VINO y el detalle de ventas (RENGLON_COMPROBANTE). 
-- Agrupamos (GROUP BY) obligatoriamente por la clave primaria del vino y los atributos descriptivos que forman su unicidad 
-- comercial (nombre, añada, volumen_ml).


-- S2 - Listar códigos y nombres de los vinos que se vendieron en todas las salas (división relacional).
SELECT 
    v.codigo_vino, 
    v.nombre
FROM VINO v
WHERE NOT EXISTS (
    SELECT 1 
    FROM SALA_VENTA sv
    WHERE NOT EXISTS (
        SELECT 1 
        FROM COMPROBANTE c
        JOIN RENGLON_COMPROBANTE rc ON c.nro_comprob = rc.nro_comprob
        WHERE c.id_sala = sv.id_sala 
          AND rc.codigo_vino = v.codigo_vino
    )
);
-- -- Implementa la división relacional estricta mediante una doble negación lógica (NOT EXISTS)


-- S3 - Cantidad de clientes de cada tipo que compraron en una sala determinada en la última semana.
WITH ClientesCompras AS (
    SELECT DISTINCT 
        comp.id_cliente,
        CASE 
            WHEN sc.id_cliente IS NOT NULL THEN 'Socio Club'
            WHEN d.id_cliente IS NOT NULL THEN 'Distribuidor'
            WHEN e.id_cliente IS NOT NULL THEN 'Exportador'
            ELSE 'Cliente General'
        END AS tipo_cliente
    FROM COMPROBANTE comp
    LEFT JOIN SOCIO_CLUB sc ON comp.id_cliente = sc.id_cliente
    LEFT JOIN DISTRIBUIDOR d ON comp.id_cliente = d.id_cliente
    LEFT JOIN EXPORTADOR e ON comp.id_cliente = e.id_cliente
    WHERE comp.id_sala = 1 -- La sala que queramos elegir
      AND comp.fecha >= CURRENT_TIMESTAMP - INTERVAL '7 days'
)
SELECT 
    tipo_cliente, 
    COUNT(id_cliente) AS cantidad_clientes
FROM ClientesCompras
GROUP BY tipo_cliente;
-- Usamos DISTINCT para no contar al mismo cliente dos veces y un CASE para ver a qué subclase pertenece.


-- S4 - Top 5 de las salas que solicitaron mayor cantidad de un vino determinado mediante transferencias en los últimos 15 días.
EXPLAIN (ANALYZE)
SELECT 
    s.id_sala,
    s.calle,
    s.numero,
    l.nombre AS localidad,
    SUM(rt.cantidad) AS total_botellas_solicitadas
FROM TRANSFERENCIA t
JOIN RENGLON_TRANSFERENCIA rt ON t.id_documento = rt.id_documento
JOIN SALA_VENTA s ON t.id_sala = s.id_sala
JOIN LOCALIDAD l ON s.codigo_postal = l.codigo_postal
WHERE 
    rt.codigo_vino = 1  -- Cambiar segun el vino que se quiera elegir
    AND t.fecha >= CURRENT_DATE - INTERVAL '15 days'
GROUP BY 
    s.id_sala,
    s.calle,
    s.numero,
    l.nombre
ORDER BY 
    total_botellas_solicitadas DESC
LIMIT 5;
-- Planning Time: 7.524 ms y Execution Time: 4.967 ms
-- Cruzamos la cabecera de TRANSFERENCIA con sus detalles en RENGLON_TRANSFERENCIA para acceder a los vinos y cantidades. 
-- Adicionalmente, unimos SALA_VENTA y LOCALIDAD para mostrar información descriptiva de la sala y no solo su ID.


-- S5 - Listado de las salas con menor cantidad de transferencias pendientes (no procesadas).
WITH PendientesPorSala AS (
    SELECT 
        sv.id_sala, 
        sv.calle, 
        sv.numero,
        COUNT(t.id_documento) AS cantidad_pendientes
    FROM SALA_VENTA sv
    LEFT JOIN TRANSFERENCIA t ON sv.id_sala = t.id_sala AND t.estado <> 'procesado'
    GROUP BY sv.id_sala, sv.calle, sv.numero
)
SELECT 
    id_sala, 
    calle, 
    numero, 
    cantidad_pendientes
FROM PendientesPorSala
WHERE cantidad_pendientes = (SELECT MIN(cantidad_pendientes) FROM PendientesPorSala);

-- Elegimos usar un LEFT JOIN para contar también a las salas que tienen 0 pendientes y una CTE con MIN() para quedarnos 
-- directamente con las del valor más bajo.


-- S6 - Para una sala determinada, los vinos sin stock en la sala pero con stock en el depósito central.
SELECT 
    v.codigo_vino, 
    v.nombre,
    sd.cantidad AS stock_en_deposito
FROM VINO v
JOIN STOCK_DEPOSITO sd ON v.codigo_vino = sd.codigo_vino
LEFT JOIN STOCK_SALA ss ON v.codigo_vino = ss.codigo_vino AND ss.id_sala = 1 -- [PARÁMETRO]: ID de la sala determinada
WHERE sd.cantidad > 0 
  AND COALESCE(ss.cantidad, 0) = 0;

-- Elegimos usar un LEFT JOIN con COALESCE para filtrar correctamente la sala, cubriendo tanto los vinos que tienen 
-- cantidad 0 como aquellos que directamente no tienen registro en esa tabla.


-- S7 - ¿Cuál es la empresa de transporte con mayor actividad en el último mes?
WITH ActividadTransporte AS (
    SELECT 
        t.codigo, 
        t.razon_social,
        COUNT(i.id_documento) AS cantidad_ingresos
    FROM TRANSPORTISTA t
    JOIN INGRESO i ON t.codigo = i.codigo_transp
    WHERE i.fecha >= CURRENT_DATE - INTERVAL '1 month'
    GROUP BY t.codigo, t.razon_social
)
SELECT 
    codigo, 
    razon_social, 
    cantidad_ingresos
FROM ActividadTransporte
WHERE cantidad_ingresos = (SELECT MAX(cantidad_ingresos) FROM ActividadTransporte);

-- Usamos una CTE para contar los ingresos de cada transportista en el último mes y filtramos con MAX() para 
-- traer al que más tiene, asegurando que muestre a todos si hay un empate en el primer puesto.


-- S8 - Monto total de ventas por sala en el último trimestre, en orden descendente.
EXPLAIN (ANALYZE)
SELECT 
    sv.id_sala,
    sv.calle,
    sv.numero,
    SUM(c.total) AS monto_total_ventas
FROM SALA_VENTA sv
JOIN COMPROBANTE c ON sv.id_sala = c.id_sala
WHERE 
    c.fecha >= CURRENT_DATE - INTERVAL '3 months'
GROUP BY 
    sv.id_sala,
    sv.calle,
    sv.numero
ORDER BY 
    monto_total_ventas DESC;
-- Planning Time: 2.972 ms y Execution Time: 62.437 ms
-- Relacionamos la tabla SALA_VENTA con los registros históricos de COMPROBANTE mediante la clave foránea id_sala. 
-- Utilizamos la función de agregación SUM(c.total) sobre la columna total del comprobante, 
-- la cual ya posee el neto calculado con los descuentos aplicados.


-- CONSULTAS AVANZADAS

-- S9 - Ficha de un vino: cepas con sus porcentajes, bodega elaboradora, maridajes y stock total (depósito más salas).
-- Herramienta esperada: Joins, agregación y vista.  

EXPLAIN (ANALYZE)
WITH CepasAgrupadas AS (
    SELECT 
        cv.codigo_vino, 
        STRING_AGG(c.nombre || ' (' || cv.porcentaje || '%)', ', ') AS cepas
    FROM COMPOSICION_VINO cv
    JOIN CEPA c ON cv.id_cepa = c.id_cepa
    WHERE cv.codigo_vino = 1 -- El vino al que le quiera hacer la ficha
    GROUP BY cv.codigo_vino
),
MaridajesAgrupados AS (
    SELECT 
        vm.codigo_vino, 
        STRING_AGG(m.nombre, ', ') AS maridajes
    FROM VINO_MARIDAJE vm
    JOIN MARIDAJE m ON vm.id_maridaje = m.id_maridaje
    WHERE vm.codigo_vino = 1
    GROUP BY vm.codigo_vino
)
SELECT 
    v.codigo_vino,
    v.nombre_vino,
    v.bodega_elaboradora,
    ca.cepas,
    ma.maridajes,
    v.stock_global AS stock_total
FROM vw_stock_total_vino v
LEFT JOIN CepasAgrupadas ca ON v.codigo_vino = ca.codigo_vino
LEFT JOIN MaridajesAgrupados ma ON v.codigo_vino = ma.codigo_vino
WHERE v.codigo_vino = 1;
-- Planning Time: 14.948 ms y Execution Time: 5.332 ms
-- Aprovechamos la vista vw_stock_total_vino para obtener directamente el stock y la bodega, 
-- cruzándola con CTEs que agrupan las cepas y maridajes para evitar registros duplicados.


-- S10 - Rendimiento en kg por hectárea de cada parcela y campaña, e identificar las parcelas que rinden menos que el promedio de su finca. 
-- Herramienta esperada: CTE y subconsulta correlacionada.

EXPLAIN (ANALYZE)
WITH RendimientoParcela AS (
    SELECT 
        lu.campaña,
        p.id_finca,
        p.nro_parcela,
        SUM(lu.kg) AS total_kg,
        p.superficie,
        (SUM(lu.kg) / p.superficie) AS kg_por_hectarea
    FROM LOTE_UVA lu
    JOIN PARCELA p ON lu.nro_parcela = p.nro_parcela AND lu.id_finca = p.id_finca
    GROUP BY lu.campaña, p.id_finca, p.nro_parcela, p.superficie
)
SELECT 
    rp.campaña,
    rp.id_finca,
    rp.nro_parcela,
    rp.kg_por_hectarea,
    (SELECT AVG(rp2.kg_por_hectarea) 
     FROM RendimientoParcela rp2 
     WHERE rp2.id_finca = rp.id_finca AND rp2.campaña = rp.campaña) AS promedio_finca
FROM RendimientoParcela rp
WHERE rp.kg_por_hectarea < (
    SELECT AVG(rp2.kg_por_hectarea) 
    FROM RendimientoParcela rp2 
    WHERE rp2.id_finca = rp.id_finca AND rp2.campaña = rp.campaña
);
-- Planning Time: 5.203 ms y Execution Time: 242.472 ms
-- Usamos una CTE (RendimientoParcela) para calcular primero el rendimiento individual (kg/ha) de cada parcela 
-- por campaña y luego aplicamos una subconsulta correlacionada en el WHERE para filtrar únicamente aquellas 
-- parcelas cuyo rendimiento quedó por debajo del promedio específico de su propia finca en ese mismo año.


-- S11 - Ranking de vinos dentro de cada sala por botellas vendidas y ventas acumuladas mensuales por sala.
-- Herramienta esperada: RANK() OVER (PARTITION BY ...) y suma acumulada con ventana. 

EXPLAIN (ANALYZE)
WITH VentasMensualesVino AS (
    SELECT 
        c.id_sala,
        sv.calle || ' ' || sv.numero AS sucursal,
        rc.codigo_vino,
        v.nombre AS nombre_vino,
        DATE_TRUNC('month', c.fecha)::DATE AS mes,
        SUM(rc.cantidad) AS botellas_vendidas,
        SUM(rc.subtotal) AS ingreso_vino
    FROM COMPROBANTE c
    JOIN RENGLON_COMPROBANTE rc ON c.nro_comprob = rc.nro_comprob
    JOIN SALA_VENTA sv ON c.id_sala = sv.id_sala
    JOIN VINO v ON rc.codigo_vino = v.codigo_vino
    GROUP BY c.id_sala, sucursal, rc.codigo_vino, nombre_vino, mes
)
SELECT 
    id_sala,
    sucursal,
    mes,
    codigo_vino,
    nombre_vino,
    botellas_vendidas,
    RANK() OVER (PARTITION BY id_sala, mes ORDER BY botellas_vendidas DESC) AS ranking_en_sala,
    ingreso_vino,
    SUM(ingreso_vino) OVER (PARTITION BY id_sala ORDER BY mes) AS ingreso_acumulado_anual
FROM VentasMensualesVino
ORDER BY id_sala, mes, ranking_en_sala;
-- Planning Time: 8.317 ms y Execution Time: 1989.612 ms
-- Usamos una CTE para pre-agrupar las ventas de cada vino por mes y sala, para luego aplicar dos funciones de 
-- ventana: un RANK() particionado por sala y mes para establecer el podio de los más vendidos, y un SUM() particionado 
-- solo por sala y ordenado por mes para calcular la facturación acumulada a lo largo del año.


-- S12 - Clientes que compraron todos los vinos de una bodega determinada, y clientes que nunca compraron ningún vino tinto.
-- Herramienta esperada: NOT EXISTS (división) y anti-join.

-- Primera parte: Clientes que compraron todos los vinos de la bodega
EXPLAIN (ANALYZE)
SELECT 
    c.id_cliente, 
    c.nombre_razon
FROM CLIENTE c
WHERE NOT EXISTS (
    SELECT v.codigo_vino 
    FROM VINO v 
    WHERE v.cuit_bodega = '20123456789' -- bodega elegida
    AND NOT EXISTS (
        SELECT 1 
        FROM COMPROBANTE comp
        JOIN RENGLON_COMPROBANTE rc ON comp.nro_comprob = rc.nro_comprob
        WHERE comp.id_cliente = c.id_cliente 
          AND rc.codigo_vino = v.codigo_vino
    )
);

-- Segunda parte: Clientes que nunca compraron ningún vino tinto
EXPLAIN (ANALYZE)
SELECT 
    c.id_cliente, 
    c.nombre_razon
FROM CLIENTE c
WHERE NOT EXISTS (
    SELECT 1
    FROM COMPROBANTE comp
    JOIN RENGLON_COMPROBANTE rc ON comp.nro_comprob = rc.nro_comprob
    JOIN VINO v ON rc.codigo_vino = v.codigo_vino
    WHERE comp.id_cliente = c.id_cliente
      AND v.tipo = 'tinto'
);
-- Planning Time: 5.515 ms y Execution Time: 222.813 ms.
-- Para la primera consulta usamos un doble NOT EXISTS para simular la operación de división relacional 
-- (clientes para los cuales no existe un vino de la bodega que no hayan comprado), y en la segunda aplicamos un 
-- anti-join clásico con un solo NOT EXISTS para descartar de la tabla clientes a cualquiera que tenga al menos un 
-- registro de compra de un vino tipo 'tinto'.