
-- Reglas protegidas: RN-09, RN-08 y RN-06
-- Propósito:
--   1. Validar que exista stock suficiente en la sala antes de insertar un
--      renglón de venta, bloqueando la fila (FOR UPDATE) para evitar condiciones
--      de carrera en ventas concurrentes (RN-09).
--   2. Garantizar que el precio unitario, el descuento y el subtotal del renglón
--      se calculen automáticamente según el vino y el tipo de clienxte (RN-08, RN-06).

CREATE OR REPLACE FUNCTION fn_trg_validar_y_preparar_renglon_venta()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_sala        INTEGER;
    v_id_cliente     INTEGER;
    v_stock_actual   INTEGER;
    v_precio_vino    NUMERIC(10,2);
    v_porc_descuento NUMERIC(5,2);
    v_importe_bruto  NUMERIC(12,2);
BEGIN
    -- Obtener sala y cliente de la cabecera del comprobante
    SELECT id_sala, id_cliente
      INTO v_id_sala, v_id_cliente
      FROM COMPROBANTE
     WHERE nro_comprob = NEW.nro_comprob;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El comprobante % no existe.', NEW.nro_comprob;
    END IF;

    -- Bloquear fila de stock de la sala para control de concurrencia y validar disponibilidad (RN-09)
    SELECT cantidad
      INTO v_stock_actual
      FROM STOCK_SALA
     WHERE id_sala = v_id_sala
       AND codigo_vino = NEW.codigo_vino
       FOR UPDATE;

    IF NOT FOUND OR COALESCE(v_stock_actual, 0) < NEW.cantidad THEN
        RAISE EXCEPTION 'Stock insuficiente del vino % en la sala % (stock disponible: %, solicitado: %) (RN-09)',
            NEW.codigo_vino, v_id_sala, COALESCE(v_stock_actual, 0), NEW.cantidad;
    END IF;

    -- Obtener el precio oficial vigente del vino (RN-01) y el porcentaje de descuento del cliente (RN-06)
    SELECT precio INTO v_precio_vino
      FROM VINO
     WHERE codigo_vino = NEW.codigo_vino;

    SELECT descuento INTO v_porc_descuento
      FROM CLIENTE
     WHERE id_cliente = v_id_cliente;

    -- Calcular los importes del renglón para que no dependan de carga manual (RN-08)
    NEW.precio_unitario := v_precio_vino;
    v_importe_bruto     := ROUND(NEW.cantidad * NEW.precio_unitario, 2);
    NEW.descuento       := ROUND(v_importe_bruto * (v_porc_descuento / 100.0), 2);
    NEW.subtotal        := v_importe_bruto - NEW.descuento;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_renglon_comprobante_valida_stock
BEFORE INSERT ON RENGLON_COMPROBANTE
FOR EACH ROW
EXECUTE FUNCTION fn_trg_validar_y_preparar_renglon_venta();



-- Reglas protegidas: RN-08 y RN-09
-- Propósito:
--   1. Descontar del stock de la sala las botellas vendidas una vez insertado
--      el renglón del comprobante (RN-09).
--   2. Recalcular automáticamente el subtotal, descuento y total en la cabecera
--      del comprobante (RN-08).

CREATE OR REPLACE FUNCTION fn_trg_impactar_venta_stock_y_totales()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_sala INTEGER;
BEGIN
    SELECT id_sala
      INTO v_id_sala
      FROM COMPROBANTE
     WHERE nro_comprob = NEW.nro_comprob;

    -- Descontar la cantidad vendida del stock de la sala (RN-09)
    UPDATE STOCK_SALA
       SET cantidad = cantidad - NEW.cantidad
     WHERE id_sala = v_id_sala
       AND codigo_vino = NEW.codigo_vino;

    -- Recalcular importes acumulados en la cabecera del comprobante (RN-08)
    UPDATE COMPROBANTE c
       SET subtotal  = COALESCE(r.suma_bruta, 0.00),
           descuento = COALESCE(r.suma_descuento, 0.00),
           total     = COALESCE(r.suma_neta, 0.00)
      FROM (
            SELECT COALESCE(SUM(ROUND(cantidad * precio_unitario, 2)), 0.00) AS suma_bruta,
                   COALESCE(SUM(descuento), 0.00)                            AS suma_descuento,
                   COALESCE(SUM(subtotal), 0.00)                             AS suma_neta
              FROM RENGLON_COMPROBANTE
             WHERE nro_comprob = NEW.nro_comprob
           ) r
     WHERE c.nro_comprob = NEW.nro_comprob;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_renglon_comprobante_actualiza_stock_y_total
AFTER INSERT ON RENGLON_COMPROBANTE
FOR EACH ROW
EXECUTE FUNCTION fn_trg_impactar_venta_stock_y_totales();


-- Reglas protegidas: RN-10 y RN-11
-- Propósito:
--   Garantizar que el estado de un INGRESO (RN-10) o de una TRANSFERENCIA (RN-11)
--   inicie en 'en_confeccion' y solo avance siguiendo la secuencia estricta:
--   en_confeccion -> terminado -> procesado, prohibiendo saltos o retrocesos.

CREATE OR REPLACE FUNCTION fn_trg_controlar_estados_documento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_regla TEXT;
BEGIN
    v_regla := CASE WHEN TG_TABLE_NAME = 'ingreso' THEN 'RN-10' ELSE 'RN-11' END;

    IF TG_OP = 'INSERT' THEN
        IF NEW.estado <> 'en_confeccion' THEN
            RAISE EXCEPTION 'Todo documento en % debe crearse inicialmente en estado en_confeccion (%)',
                TG_TABLE_NAME, v_regla;
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' AND OLD.estado IS DISTINCT FROM NEW.estado THEN
        IF NOT (
            (OLD.estado = 'en_confeccion' AND NEW.estado = 'terminado') OR
            (OLD.estado = 'terminado'     AND NEW.estado = 'procesado')
        ) THEN
            RAISE EXCEPTION 'Transición de estado inválida en % (documento %): no se puede pasar de % a % (%)',
                TG_TABLE_NAME, OLD.id_documento, OLD.estado, NEW.estado, v_regla;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ingreso_control_estado
BEFORE INSERT OR UPDATE OF estado ON INGRESO
FOR EACH ROW
EXECUTE FUNCTION fn_trg_controlar_estados_documento();

CREATE TRIGGER trg_transferencia_control_estado
BEFORE INSERT OR UPDATE OF estado ON TRANSFERENCIA
FOR EACH ROW
EXECUTE FUNCTION fn_trg_controlar_estados_documento();


-- Regla protegida: RN-11
-- Propósito:
--   Forzar que la fecha de confección de una transferencia sea la fecha actual
--   (CURRENT_DATE) al momento del alta e impedir su modificación posterior.

CREATE OR REPLACE FUNCTION fn_trg_fecha_confeccion_transferencia()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.fecha := CURRENT_DATE;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.fecha IS DISTINCT FROM OLD.fecha THEN
            RAISE EXCEPTION 'La fecha de confección de la transferencia % no puede modificarse (RN-11)',
                OLD.id_documento;
        END IF;
        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_transferencia_fecha_confeccion
BEFORE INSERT OR UPDATE OF fecha ON TRANSFERENCIA
FOR EACH ROW
EXECUTE FUNCTION fn_trg_fecha_confeccion_transferencia();


-- Regla protegida: RN-12
-- Propósito:
--   Impedir que se agreguen, modifiquen o eliminen renglones de un ingreso o
--   de una transferencia cuando el documento cabecera no está en estado
--   'en_confeccion'.

CREATE OR REPLACE FUNCTION fn_trg_bloquear_renglones_ingreso()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_doc INTEGER;
    v_estado estado_documento;
BEGIN
    v_id_doc := COALESCE(NEW.id_documento, OLD.id_documento);

    SELECT estado
      INTO v_estado
      FROM INGRESO
     WHERE id_documento = v_id_doc;

    -- Si la cabecera existe y su estado no es 'en_confeccion', se rechaza el cambio.
    -- (Si la cabecera no se encuentra durante un DELETE por ON DELETE CASCADE del padre, se permite).
    IF FOUND AND v_estado <> 'en_confeccion' THEN
        RAISE EXCEPTION 'No se permite % renglones en el ingreso % porque su estado es % (RN-12)',
            TG_OP, v_id_doc, v_estado;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_renglon_ingreso_bloqueo
BEFORE INSERT OR UPDATE OR DELETE ON RENGLON_INGRESO
FOR EACH ROW
EXECUTE FUNCTION fn_trg_bloquear_renglones_ingreso();


CREATE OR REPLACE FUNCTION fn_trg_bloquear_renglones_transferencia()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_doc INTEGER;
    v_estado estado_documento;
BEGIN
    v_id_doc := COALESCE(NEW.id_documento, OLD.id_documento);

    SELECT estado
      INTO v_estado
      FROM TRANSFERENCIA
     WHERE id_documento = v_id_doc;

    IF FOUND AND v_estado <> 'en_confeccion' THEN
        RAISE EXCEPTION 'No se permite % renglones en la transferencia % porque su estado es % (RN-12)',
            TG_OP, v_id_doc, v_estado;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_renglon_transferencia_bloqueo
BEFORE INSERT OR UPDATE OR DELETE ON RENGLON_TRANSFERENCIA
FOR EACH ROW
EXECUTE FUNCTION fn_trg_bloquear_renglones_transferencia();


-- Regla protegida: RN-13
-- Propósito:
--   Registrar automáticamente en AUDITORIA_PRECIO todo cambio en el precio de
--   un vino, guardando precio anterior, precio nuevo, fecha/hora y usuario.

CREATE OR REPLACE FUNCTION fn_trg_auditar_precio_vino()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.precio IS DISTINCT FROM NEW.precio THEN
        INSERT INTO AUDITORIA_PRECIO (
            precio_anterior,
            precio_nuevo,
            fecha_hora,
            usuario,
            codigo_vino
        ) VALUES (
            OLD.precio,
            NEW.precio,
            CURRENT_TIMESTAMP,
            CURRENT_USER,
            NEW.codigo_vino
        );
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_vino_auditoria_precio
AFTER UPDATE OF precio ON VINO
FOR EACH ROW
WHEN (OLD.precio IS DISTINCT FROM NEW.precio)
EXECUTE FUNCTION fn_trg_auditar_precio_vino();


-- Regla protegida: RN-05
-- Propósito:
--   Verificar al cierre de la transacción (DEFERRABLE INITIALLY DEFERRED) que
--   la suma de los porcentajes de cepas en COMPOSICION_VINO para un vino dado
--   sea exactamente 100%.

CREATE OR REPLACE FUNCTION fn_trg_validar_composicion_vino()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_codigo_vino INTEGER;
    v_suma_porc   NUMERIC(6,2);
BEGIN
    v_codigo_vino := COALESCE(NEW.codigo_vino, OLD.codigo_vino);

    -- Si el vino fue eliminado en la misma transacción, no se exige suma 100
    IF NOT EXISTS (SELECT 1 FROM VINO WHERE codigo_vino = v_codigo_vino) THEN
        RETURN NULL;
    END IF;

    SELECT COALESCE(SUM(porcentaje), 0.00)
      INTO v_suma_porc
      FROM COMPOSICION_VINO
     WHERE codigo_vino = v_codigo_vino;

    IF v_suma_porc <> 100.00 THEN
        RAISE EXCEPTION 'La suma de los porcentajes de corte del vino % es %%, pero debe ser exactamente 100.00%% (RN-05)',
            v_codigo_vino, v_suma_porc;
    END IF;

    RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER trg_composicion_vino_suma_100
AFTER INSERT OR UPDATE OR DELETE ON COMPOSICION_VINO
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION fn_trg_validar_composicion_vino();