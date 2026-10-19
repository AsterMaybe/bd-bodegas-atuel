
-- PROCEDIMIENTO: sp_procesar_ingreso
--
-- Regla de negocio que protege:
--   - RN-10: Sólo un ingreso en estado 'terminado' puede impactar en el stock
--     del depósito central y pasar al estado 'procesado'. Las transiciones son
--     en_confeccion -> terminado -> procesado y no retroceden
--
-- Propósito y comportamiento transaccional:
--   1. Bloquea la cabecera del ingreso con FOR UPDATE para evitar que dos
--      sesiones concurrentes procesen el mismo documento al mismo tiempo
--   2. Verifica que el ingreso exista, esté en estado 'terminado' y posea al
--      menos un renglón cargado
--   3. Bloquea en orden determinístico (ORDER BY codigo_vino) las filas
--      existentes en STOCK_DEPOSITO para prevenir interbloqueos (deadlocks).
--   4. Suma las cantidades de botellas al depósito central (creando la fila si
--      el vino aún no tenía registro en STOCK_DEPOSITO)
--   5. Cambia el estado del ingreso a 'procesado'
--   6. Si ocurre cualquier error o excepción (RAISE EXCEPTION), PostgreSQL
--      revierte automáticamente todos los cambios de la transacción
--
-- Parámetros:
--   - p_id_documento (INTEGER): Identificador del ingreso a procesar

CREATE OR REPLACE PROCEDURE sp_procesar_ingreso(
    p_id_documento INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_estado estado_documento;
BEGIN
    -- 1. Bloquear la fila de cabecera del ingreso para control de concurrencia
    SELECT i.estado
    INTO v_estado
    FROM INGRESO i
    WHERE i.id_documento = p_id_documento
    FOR UPDATE;

    -- 2. Validar existencia y estado 'terminado' (RN-10)
    IF NOT FOUND THEN
        RAISE EXCEPTION 'El ingreso % no existe (RN-10)', p_id_documento;
    END IF;

    IF v_estado IS DISTINCT FROM 'terminado' THEN
        RAISE EXCEPTION 'El ingreso % no puede procesarse porque su estado actual es "%" y se requiere "terminado" (RN-10)',
            p_id_documento, v_estado;
    END IF;

    -- 3. Validar que el ingreso tenga al menos un renglón cargado
    IF NOT EXISTS (
        SELECT 1
        FROM RENGLON_INGRESO r
        WHERE r.id_documento = p_id_documento
    ) THEN
        RAISE EXCEPTION 'El ingreso % no posee renglones asociados para procesar (RN-10)',
            p_id_documento;
    END IF;

    -- 4. Bloquear filas existentes en STOCK_DEPOSITO en orden determinístico
    PERFORM 1
    FROM STOCK_DEPOSITO d
    JOIN RENGLON_INGRESO r ON r.codigo_vino = d.codigo_vino
    WHERE r.id_documento = p_id_documento
    ORDER BY d.codigo_vino
    FOR UPDATE;

    -- 5. Impactar el stock en el depósito central (inserta o acumula)
    INSERT INTO STOCK_DEPOSITO (codigo_vino, cantidad)
    SELECT r.codigo_vino, r.cantidad
    FROM RENGLON_INGRESO r
    WHERE r.id_documento = p_id_documento
    ON CONFLICT (codigo_vino)
    DO UPDATE SET cantidad = STOCK_DEPOSITO.cantidad + EXCLUDED.cantidad;

    -- 6. Cambiar el estado del documento a 'procesado' (RN-10)
    UPDATE INGRESO
    SET estado = 'procesado'
    WHERE id_documento = p_id_documento;
END;
$$;



-- PROCEDIMIENTO: sp_procesar_transferencia

-- Reglas de negocio que protege:
--   - RN-11: Sólo una transferencia en estado 'terminado' impacta en el stock
--     (descuenta del depósito central y suma al stock de la sala solicitante)
--     y pasa a 'procesado'. No puede procesarse si el depósito no tiene stock
--     suficiente
--   - RN-09: El stock nunca es negativo
--
-- Propósito y comportamiento transaccional:
--   1. Bloquea la cabecera de la transferencia con FOR UPDATE
--   2. Valida que la transferencia exista, esté en estado 'terminado' y tenga
--      al menos un renglón cargado
--   3. Bloquea las filas afectadas en STOCK_DEPOSITO y STOCK_SALA con
--      FOR UPDATE en orden de codigo_vino para evitar condiciones de carrera
--   4. Verifica explícitamente que cada vino solicitado exista en
--      STOCK_DEPOSITO y tenga cantidad suficiente (resolviendo el caso en que
--      un vino no tenga fila en STOCK_DEPOSITO y un UPDATE directo no afecte
--      filas sin dar error)
--   5. Descuenta las botellas de STOCK_DEPOSITO y las suma en STOCK_SALA
--   6. Actualiza el estado de la transferencia a 'procesado'. Si cualquier
--      validación o restricción falla, toda la operación se revierte
--
-- Parámetros:
--   - p_id_documento (INTEGER): Número de solicitud de transferencia

CREATE OR REPLACE PROCEDURE sp_procesar_transferencia(
    p_id_documento INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_estado estado_documento;
    v_id_sala INTEGER;
    v_vino_faltante INTEGER;
    v_cant_solicitada INTEGER;
    v_cant_disponible INTEGER;
BEGIN
    -- 1. Bloquear la cabecera de la transferencia con FOR UPDATE
    SELECT t.estado, t.id_sala
    INTO v_estado, v_id_sala
    FROM TRANSFERENCIA t
    WHERE t.id_documento = p_id_documento
    FOR UPDATE;

    -- 2. Validar existencia y estado 'terminado' (RN-11)
    IF NOT FOUND THEN
        RAISE EXCEPTION 'La transferencia % no existe (RN-11)', p_id_documento;
    END IF;

    IF v_estado IS DISTINCT FROM 'terminado' THEN
        RAISE EXCEPTION 'La transferencia % no puede procesarse porque su estado actual es "%" y se requiere "terminado"',
            p_id_documento, v_estado;
    END IF;

    -- 3. Validar que la transferencia tenga al menos un renglón cargado
    IF NOT EXISTS (
        SELECT 1
        FROM RENGLON_TRANSFERENCIA r
        WHERE r.id_documento = p_id_documento
    ) THEN
        RAISE EXCEPTION 'La transferencia % no posee renglones asociados para procesar (RN-11)',
            p_id_documento;
    END IF;

    -- 4. Bloquear las filas existentes en STOCK_DEPOSITO en orden de codigo_vino
    PERFORM 1
    FROM STOCK_DEPOSITO d
    JOIN RENGLON_TRANSFERENCIA r ON r.codigo_vino = d.codigo_vino
    WHERE r.id_documento = p_id_documento
    ORDER BY d.codigo_vino
    FOR UPDATE;

    -- 5. Verificar que todos los vinos existan en STOCK_DEPOSITO y alcancen las botellas
    SELECT r.codigo_vino, r.cantidad, COALESCE(d.cantidad, 0)
    INTO v_vino_faltante, v_cant_solicitada, v_cant_disponible
    FROM RENGLON_TRANSFERENCIA r
    LEFT JOIN STOCK_DEPOSITO d ON d.codigo_vino = r.codigo_vino
    WHERE r.id_documento = p_id_documento
      AND COALESCE(d.cantidad, 0) < r.cantidad
    ORDER BY r.codigo_vino
    LIMIT 1;

    IF FOUND THEN
        RAISE EXCEPTION 'Stock insuficiente en el depósito central para el vino % en la transferencia % (solicitado: %, disponible: %) (RN-11)',
            v_vino_faltante, p_id_documento, v_cant_solicitada, v_cant_disponible;
    END IF;

    -- 6. Bloquear las filas existentes en STOCK_SALA de la sala destino
    PERFORM 1
    FROM STOCK_SALA s
    JOIN RENGLON_TRANSFERENCIA r ON r.codigo_vino = s.codigo_vino
    WHERE s.id_sala = v_id_sala
      AND r.id_documento = p_id_documento
    ORDER BY s.codigo_vino
    FOR UPDATE;

    -- 7. Descontar las botellas del depósito central
    UPDATE STOCK_DEPOSITO d
    SET cantidad = d.cantidad - r.cantidad
    FROM RENGLON_TRANSFERENCIA r
    WHERE r.id_documento = p_id_documento
      AND d.codigo_vino = r.codigo_vino;

    -- 8. Sumar las botellas al stock de la sala solicitante (crea la fila si no existe)
    INSERT INTO STOCK_SALA (id_sala, codigo_vino, cantidad)
    SELECT v_id_sala, r.codigo_vino, r.cantidad
    FROM RENGLON_TRANSFERENCIA r
    WHERE r.id_documento = p_id_documento
    ON CONFLICT (id_sala, codigo_vino)
    DO UPDATE SET cantidad = STOCK_SALA.cantidad + EXCLUDED.cantidad;

    -- 9. Actualizar el estado de la transferencia a 'procesado' (RN-11)
    UPDATE TRANSFERENCIA
    SET estado = 'procesado'
    WHERE id_documento = p_id_documento;
END;
$$;