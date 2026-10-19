


-- 1. FUNCIÓN: fn_stock_sala

-- Propósito:
--   Devuelve la cantidad de botellas disponibles de un vino específico en una
--   sala de venta determinada. Si no existe registro para ese par (sala, vino)
--   en la tabla STOCK_SALA, retorna 0. Asiste en la validación de RN-09
--
-- Parámetros:
--   - p_id_sala (INTEGER): Identificador de la sala de venta
--   - p_codigo_vino (INTEGER): Código identificador del vino
--
-- Retorno:
--   - INTEGER: Cantidad de botellas en stock (>= 0)
--
-- Volatilidad:
--   - STABLE: No modifica datos, pero realiza una consulta sobre la tabla
--     STOCK_SALA. Dentro de una misma sentencia o instantánea de transacción
--     retorna siempre el mismo resultado para los mismos argumentos

CREATE OR REPLACE FUNCTION fn_stock_sala(
    p_id_sala INTEGER,
    p_codigo_vino INTEGER
)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(
        (SELECT s.cantidad
         FROM STOCK_SALA s
         WHERE s.id_sala = p_id_sala
           AND s.codigo_vino = p_codigo_vino),
        0
    );
$$;



-- FUNCIÓN: fn_stock_deposito

-- Propósito:
--   Devuelve la cantidad de botellas disponibles de un vino específico en el
--   depósito central (STOCK_DEPOSITO). Si el vino aún no registra fila en el
--   depósito, retorna 0. Asiste en las transferencias y reportes (RN-11)
--
-- Parámetros:
--   - p_codigo_vino (INTEGER): Código identificador del vino
--
-- Retorno:
--   - INTEGER: Cantidad de botellas en el depósito central (>= 0)
--
-- Volatilidad:
--   - STABLE: Lee datos de la tabla STOCK_DEPOSITO sin modificar el estado de
--     la base de datos

CREATE OR REPLACE FUNCTION fn_stock_deposito(
    p_codigo_vino INTEGER
)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(
        (SELECT d.cantidad
         FROM STOCK_DEPOSITO d
         WHERE d.codigo_vino = p_codigo_vino),
        0
    );
$$;



-- FUNCIÓN: fn_descuento_cliente

-- Propósito:
--   Determina y devuelve el porcentaje de descuento que le corresponde a un
--   cliente según su subtipo en la jerarquía (RN-06)
--   (Socio 10%, Distribuidor 20%, Exportador 30%)
--   Si el cliente tiene un descuento especial mayor ya registrado en la tabla
--   CLIENTE (por ejemplo, 35% por tener más de 3 permisos según consulta U6),
--   respeta el mayor valor o el porcentaje de su subclase
--
-- Parámetros:
--   - p_id_cliente (INTEGER): Identificador único del cliente
--
-- Retorno:
--   - NUMERIC(5,2): Porcentaje de bonificación aplicable (ej. 10.00, 20.00, 30.00)
--
-- Volatilidad:
--   - STABLE: Consulta las tablas de la jerarquía de clientes (EXPORTADOR,
--     DISTRIBUIDOR, SOCIO_CLUB y CLIENTE) sin modificar la base de datos

CREATE OR REPLACE FUNCTION fn_descuento_cliente(
    p_id_cliente INTEGER
)
RETURNS NUMERIC(5,2)
LANGUAGE sql
STABLE
AS $$
    SELECT GREATEST(
        COALESCE((SELECT c.descuento FROM CLIENTE c WHERE c.id_cliente = p_id_cliente), 0.00),
        CASE
            WHEN EXISTS (SELECT 1 FROM EXPORTADOR e WHERE e.id_cliente = p_id_cliente) THEN 30.00
            WHEN EXISTS (SELECT 1 FROM DISTRIBUIDOR d WHERE d.id_cliente = p_id_cliente) THEN 20.00
            WHEN EXISTS (SELECT 1 FROM SOCIO_CLUB s WHERE s.id_cliente = p_id_cliente) THEN 10.00
            ELSE 0.00
        END
    )::NUMERIC(5,2);
$$;



-- FUNCIÓN: fn_total_comprobante

-- Propósito:
--   Calcula el importe total final a pagar de un comprobante de venta a partir
--   de la suma de los subtotales de sus renglones con el descuento ya aplicado
--   (RN-08). Si el comprobante aún no posee renglones cargados, retorna 0.00
--
-- Parámetros:
--   - p_nro_comprob (INTEGER): Número identificador del comprobante
--
-- Retorno:
--   - NUMERIC(12,2): Importe total neto del comprobante
--
-- Volatilidad:
--   - STABLE: Realiza una agregación de lectura sobre la tabla
--     RENGLON_COMPROBANTE sin alterar datos

CREATE OR REPLACE FUNCTION fn_total_comprobante(
    p_nro_comprob INTEGER
)
RETURNS NUMERIC(12,2)
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(SUM(r.subtotal), 0.00)::NUMERIC(12,2)
    FROM RENGLON_COMPROBANTE r
    WHERE r.nro_comprob = p_nro_comprob;
$$;



-- 5. FUNCIÓN: fn_antiguedad_anios

-- Propósito:
--   Calcula la antigüedad en años completos transcurridos desde una fecha de
--   origen (ej. fecha_ingreso en PERSONAL o fecha_alta en CLIENTE) hasta la
--   fecha actual del servidor (CURRENT_DATE). Reutilizable en consultas y
--   actualizaciones como U2, D1, D3 y D4
--
-- Parámetros:
--   - p_fecha (DATE): Fecha inicial desde la cual calcular la antigüedad
--
-- Retorno:
--   - INTEGER: Cantidad de años completos transcurridos
--
-- Volatilidad:
--   - STABLE: Depende de CURRENT_DATE. Aunque no lee tablas de usuario, el
--     resultado varía si se ejecuta en días distintos, pero se mantiene fijo
--     dentro de una misma ejecución o transacción (por ello NO es IMMUTABLE)

CREATE OR REPLACE FUNCTION fn_antiguedad_anios(
    p_fecha DATE
)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
    SELECT EXTRACT(YEAR FROM AGE(CURRENT_DATE, p_fecha))::INTEGER;
$$;



-- FUNCIÓN: fn_calcular_descuento_renglon

-- Propósito:
--   Calcula de forma determinística el monto monetario de descuento para un
--   renglón de venta a partir de la cantidad de botellas, el precio unitario y
--   el porcentaje de descuento aplicable (RN-06, RN-08)
--
-- Parámetros:
--   - p_cantidad (INTEGER): Cantidad de botellas vendidas
--   - p_precio_unitario (NUMERIC(10,2)): Precio unitario del vino
--   - p_porcentaje_descuento (NUMERIC(5,2)): Porcentaje de descuento (0 a 100)
--
-- Retorno:
--   - NUMERIC(10,2): Monto total descontado en ese renglón redondeado a 2 dec.
--
-- Volatilidad:
--   - IMMUTABLE: Función puramente matemática. No consulta tablas ni depende
--     del reloj del sistema; ante los mismos argumentos de entrada devuelve
--     exactamente el mismo resultado siempre

CREATE OR REPLACE FUNCTION fn_calcular_descuento_renglon(
    p_cantidad INTEGER,
    p_precio_unitario NUMERIC(10,2),
    p_porcentaje_descuento NUMERIC(5,2)
)
RETURNS NUMERIC(10,2)
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT ROUND((p_cantidad * p_precio_unitario) * (p_porcentaje_descuento / 100.0), 2)::NUMERIC(10,2);
$$;



-- FUNCIÓN: fn_calcular_subtotal_renglon

-- Propósito:
--   Calcula de forma determinística el subtotal neto de un renglón de venta
--   según la fórmula del diccionario de datos:
--   (precio_unitario * cantidad) - descuento (RN-08)
--
-- Parámetros:
--   - p_cantidad (INTEGER): Cantidad de botellas vendidas
--   - p_precio_unitario (NUMERIC(10,2)): Precio unitario congelado del vino
--   - p_descuento_monto (NUMERIC(10,2)): Monto monetario descontado en el renglón
--
-- Retorno:
--   - NUMERIC(12,2): Subtotal neto del renglón
--
-- Volatilidad:
--   - IMMUTABLE: Función puramente aritmética sin efectos secundarios ni
--     dependencia de tablas o funciones de tiempo; para iguales entradas
--     produce perpetuamente la misma salida

CREATE OR REPLACE FUNCTION fn_calcular_subtotal_renglon(
    p_cantidad INTEGER,
    p_precio_unitario NUMERIC(10,2),
    p_descuento_monto NUMERIC(10,2)
)
RETURNS NUMERIC(12,2)
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT ROUND((p_cantidad * p_precio_unitario) - p_descuento_monto, 2)::NUMERIC(12,2);
$$;