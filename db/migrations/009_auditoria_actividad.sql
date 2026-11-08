-- Migración 009: Tabla de auditoría de actividad general (CORREGIDA v2)
-- Registra operaciones INSERT, UPDATE, DELETE en tablas clave del sistema

-- Tabla principal de auditoría de actividad
CREATE TABLE IF NOT EXISTS AUDITORIA_ACTIVIDAD (
    id_auditoria SERIAL PRIMARY KEY,
    tabla_afectada VARCHAR(50) NOT NULL,
    operacion VARCHAR(10) NOT NULL CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE')),
    id_registro VARCHAR(100) NOT NULL,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    usuario VARCHAR(100) NOT NULL DEFAULT CURRENT_USER,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    descripcion TEXT
);

CREATE INDEX IF NOT EXISTS idx_auditoria_tabla_fecha ON AUDITORIA_ACTIVIDAD (tabla_afectada, fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_fecha ON AUDITORIA_ACTIVIDAD (usuario, fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON AUDITORIA_ACTIVIDAD (fecha_hora DESC);

-- Función genérica para generar descripción legible
CREATE OR REPLACE FUNCTION fn_generar_descripcion_actividad(
    p_tabla VARCHAR,
    p_operacion VARCHAR,
    p_id_registro VARCHAR,
    p_datos_anteriores JSONB,
    p_datos_nuevos JSONB
) RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_descripcion TEXT;
BEGIN
    CASE p_tabla
        WHEN 'VINO' THEN
            CASE p_operacion
                WHEN 'INSERT' THEN
                    v_descripcion := 'Vino creado: ' || COALESCE(p_datos_nuevos->>'nombre', 'Sin nombre') || ' (' || p_id_registro || ')';
                WHEN 'UPDATE' THEN
                    v_descripcion := 'Vino actualizado: ' || COALESCE(p_datos_nuevos->>'nombre', p_datos_anteriores->>'nombre', 'Sin nombre') || ' (' || p_id_registro || ')';
                WHEN 'DELETE' THEN
                    v_descripcion := 'Vino eliminado: ' || COALESCE(p_datos_anteriores->>'nombre', 'Sin nombre') || ' (' || p_id_registro || ')';
            END CASE;
        WHEN 'CLIENTE' THEN
            CASE p_operacion
                WHEN 'INSERT' THEN
                    v_descripcion := 'Cliente creado: ' || COALESCE(p_datos_nuevos->>'nombre_razon', 'Sin nombre') || ' (' || p_id_registro || ')';
                WHEN 'UPDATE' THEN
                    v_descripcion := 'Cliente actualizado: ' || COALESCE(p_datos_nuevos->>'nombre_razon', p_datos_anteriores->>'nombre_razon', 'Sin nombre') || ' (' || p_id_registro || ')';
                WHEN 'DELETE' THEN
                    v_descripcion := 'Cliente eliminado: ' || COALESCE(p_datos_anteriores->>'nombre_razon', 'Sin nombre') || ' (' || p_id_registro || ')';
            END CASE;
        WHEN 'COMPROBANTE' THEN
            CASE p_operacion
                WHEN 'INSERT' THEN
                    v_descripcion := 'Venta registrada: Comprobante #' || p_id_registro;
                WHEN 'UPDATE' THEN
                    v_descripcion := 'Venta modificada: Comprobante #' || p_id_registro;
                WHEN 'DELETE' THEN
                    v_descripcion := 'Venta anulada: Comprobante #' || p_id_registro;
            END CASE;
        WHEN 'INGRESO' THEN
            CASE p_operacion
                WHEN 'INSERT' THEN
                    v_descripcion := 'Ingreso creado: #' || p_id_registro || ' (en confección)';
                WHEN 'UPDATE' THEN
                    v_descripcion := 'Ingreso #' || p_id_registro || ' cambió a estado: ' || COALESCE(p_datos_nuevos->>'estado', 'desconocido');
                WHEN 'DELETE' THEN
                    v_descripcion := 'Ingreso eliminado: #' || p_id_registro;
            END CASE;
        WHEN 'TRANSFERENCIA' THEN
            CASE p_operacion
                WHEN 'INSERT' THEN
                    v_descripcion := 'Transferencia creada: #' || p_id_registro || ' (en confección)';
                WHEN 'UPDATE' THEN
                    v_descripcion := 'Transferencia #' || p_id_registro || ' cambió a estado: ' || COALESCE(p_datos_nuevos->>'estado', 'desconocido');
                WHEN 'DELETE' THEN
                    v_descripcion := 'Transferencia eliminada: #' || p_id_registro;
            END CASE;
        WHEN 'RENGLON_INGRESO' THEN
            CASE p_operacion
                WHEN 'INSERT' THEN
                    v_descripcion := 'Renglón agregado a ingreso #' || (p_datos_nuevos->>'id_documento') || ': ' || (p_datos_nuevos->>'cantidad') || ' botellas';
                WHEN 'UPDATE' THEN
                    v_descripcion := 'Renglón modificado en ingreso #' || (p_datos_nuevos->>'id_documento');
                WHEN 'DELETE' THEN
                    v_descripcion := 'Renglón eliminado de ingreso #' || (p_datos_anteriores->>'id_documento');
            END CASE;
        WHEN 'RENGLON_TRANSFERENCIA' THEN
            CASE p_operacion
                WHEN 'INSERT' THEN
                    v_descripcion := 'Renglón agregado a transferencia #' || (p_datos_nuevos->>'id_documento') || ': ' || (p_datos_nuevos->>'cantidad') || ' botellas';
                WHEN 'UPDATE' THEN
                    v_descripcion := 'Renglón modificado en transferencia #' || (p_datos_nuevos->>'id_documento');
                WHEN 'DELETE' THEN
                    v_descripcion := 'Renglón eliminado de transferencia #' || (p_datos_anteriores->>'id_documento');
            END CASE;
        WHEN 'RENGLON_COMPROBANTE' THEN
            CASE p_operacion
                WHEN 'INSERT' THEN
                    v_descripcion := 'Producto agregado a venta #' || (p_datos_nuevos->>'nro_comprob') || ': ' || (p_datos_nuevos->>'cantidad') || ' botellas';
                WHEN 'UPDATE' THEN
                    v_descripcion := 'Producto modificado en venta #' || (p_datos_nuevos->>'nro_comprob');
                WHEN 'DELETE' THEN
                    v_descripcion := 'Producto eliminado de venta #' || (p_datos_anteriores->>'nro_comprob');
            END CASE;
        WHEN 'STOCK_DEPOSITO' THEN
            CASE p_operacion
                WHEN 'UPDATE' THEN
                    v_descripcion := 'Stock depósito actualizado: Vino #' || p_id_registro || ' = ' || COALESCE(p_datos_nuevos->>'cantidad', '0') || ' botellas';
                WHEN 'INSERT' THEN
                    v_descripcion := 'Stock depósito inicializado: Vino #' || p_id_registro;
            END CASE;
        WHEN 'STOCK_SALA' THEN
            CASE p_operacion
                WHEN 'UPDATE' THEN
                    v_descripcion := 'Stock sala actualizado: Sala #' || (p_datos_nuevos->>'id_sala') || ', Vino #' || (p_datos_nuevos->>'codigo_vino') || ' = ' || COALESCE(p_datos_nuevos->>'cantidad', '0') || ' botellas';
                WHEN 'INSERT' THEN
                    v_descripcion := 'Stock sala inicializado: Sala #' || (p_datos_nuevos->>'id_sala') || ', Vino #' || (p_datos_nuevos->>'codigo_vino');
            END CASE;
        WHEN 'BODEGA' THEN
            CASE p_operacion
                WHEN 'INSERT' THEN
                    v_descripcion := 'Bodega creada: ' || COALESCE(p_datos_nuevos->>'razon_social', 'Sin nombre') || ' (' || p_id_registro || ')';
                WHEN 'UPDATE' THEN
                    v_descripcion := 'Bodega actualizada: ' || COALESCE(p_datos_nuevos->>'razon_social', p_datos_anteriores->>'razon_social', 'Sin nombre') || ' (' || p_id_registro || ')';
                WHEN 'DELETE' THEN
                    v_descripcion := 'Bodega eliminada: ' || COALESCE(p_datos_anteriores->>'razon_social', 'Sin nombre') || ' (' || p_id_registro || ')';
            END CASE;
        WHEN 'FINCA' THEN
            CASE p_operacion
                WHEN 'INSERT' THEN
                    v_descripcion := 'Finca creada: ' || COALESCE(p_datos_nuevos->>'nombre', 'Sin nombre') || ' (' || p_id_registro || ')';
                WHEN 'UPDATE' THEN
                    v_descripcion := 'Finca actualizada: ' || COALESCE(p_datos_nuevos->>'nombre', p_datos_anteriores->>'nombre', 'Sin nombre') || ' (' || p_id_registro || ')';
                WHEN 'DELETE' THEN
                    v_descripcion := 'Finca eliminada: ' || COALESCE(p_datos_anteriores->>'nombre', 'Sin nombre') || ' (' || p_id_registro || ')';
            END CASE;
        WHEN 'PARCELA' THEN
            CASE p_operacion
                WHEN 'INSERT' THEN
                    v_descripcion := 'Parcela creada: #' || p_id_registro;
                WHEN 'UPDATE' THEN
                    v_descripcion := 'Parcela actualizada: #' || p_id_registro;
                WHEN 'DELETE' THEN
                    v_descripcion := 'Parcela eliminada: #' || p_id_registro;
            END CASE;
        WHEN 'LOTE_UVA' THEN
            CASE p_operacion
                WHEN 'INSERT' THEN
                    v_descripcion := 'Lote de uva registrado: #' || p_id_registro || ' - ' || COALESCE(p_datos_nuevos->>'kg', '0') || ' kg';
                WHEN 'UPDATE' THEN
                    v_descripcion := 'Lote de uva actualizado: #' || p_id_registro;
                WHEN 'DELETE' THEN
                    v_descripcion := 'Lote de uva eliminado: #' || p_id_registro;
            END CASE;
        ELSE
            v_descripcion := p_operacion || ' en ' || p_tabla || ' #' || p_id_registro;
    END CASE;

    RETURN v_descripcion;
END;
$$;

-- Función auxiliar para obtener ID del registro según la tabla (usa SQL dinámico)
CREATE OR REPLACE FUNCTION fn_get_registro_id(p_tabla TEXT, p_operacion TEXT, p_new JSONB, p_old JSONB)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_id TEXT;
BEGIN
    CASE UPPER(p_tabla)
        WHEN 'PARCELA' THEN
            v_id := COALESCE(p_new->>'nro_parcela', p_old->>'nro_parcela') || '-' || COALESCE(p_new->>'id_finca', p_old->>'id_finca');
        WHEN 'COMPOSICION_VINO' THEN
            v_id := COALESCE(p_new->>'codigo_vino', p_old->>'codigo_vino') || '-' || COALESCE(p_new->>'id_cepa', p_old->>'id_cepa');
        WHEN 'VINO_MARIDAJE' THEN
            v_id := COALESCE(p_new->>'codigo_vino', p_old->>'codigo_vino') || '-' || COALESCE(p_new->>'id_maridaje', p_old->>'id_maridaje');
        WHEN 'RENGLON_COMPROBANTE' THEN
            v_id := COALESCE(p_new->>'nro_comprob', p_old->>'nro_comprob') || '-' || COALESCE(p_new->>'codigo_vino', p_old->>'codigo_vino');
        WHEN 'RENGLON_INGRESO' THEN
            v_id := COALESCE(p_new->>'id_documento', p_old->>'id_documento') || '-' || COALESCE(p_new->>'codigo_vino', p_old->>'codigo_vino');
        WHEN 'RENGLON_TRANSFERENCIA' THEN
            v_id := COALESCE(p_new->>'id_documento', p_old->>'id_documento') || '-' || COALESCE(p_new->>'codigo_vino', p_old->>'codigo_vino');
        WHEN 'STOCK_SALA' THEN
            v_id := COALESCE(p_new->>'id_sala', p_old->>'id_sala') || '-' || COALESCE(p_new->>'codigo_vino', p_old->>'codigo_vino');
        WHEN 'TRANSPORTISTA_LOCALIDAD' THEN
            v_id := COALESCE(p_new->>'codigo_transp', p_old->>'codigo_transp') || '-' || COALESCE(p_new->>'codigo_postal', p_old->>'codigo_postal');
        WHEN 'PERMISO_EXPORTADOR' THEN
            v_id := COALESCE(p_new->>'codigo_permiso', p_old->>'codigo_permiso');
        WHEN 'VINO' THEN
            v_id := COALESCE(p_new->>'codigo_vino', p_old->>'codigo_vino');
        WHEN 'CLIENTE' THEN
            v_id := COALESCE(p_new->>'id_cliente', p_old->>'id_cliente');
        WHEN 'COMPROBANTE' THEN
            v_id := COALESCE(p_new->>'nro_comprob', p_old->>'nro_comprob');
        WHEN 'INGRESO' THEN
            v_id := COALESCE(p_new->>'id_documento', p_old->>'id_documento');
        WHEN 'TRANSFERENCIA' THEN
            v_id := COALESCE(p_new->>'id_documento', p_old->>'id_documento');
        WHEN 'BODEGA' THEN
            v_id := COALESCE(p_new->>'cuit', p_old->>'cuit');
        WHEN 'FINCA' THEN
            v_id := COALESCE(p_new->>'id_finca', p_old->>'id_finca');
        WHEN 'LOTE_UVA' THEN
            v_id := COALESCE(p_new->>'nro_lote', p_old->>'nro_lote');
        WHEN 'STOCK_DEPOSITO' THEN
            v_id := COALESCE(p_new->>'codigo_vino', p_old->>'codigo_vino');
        WHEN 'CEPA' THEN
            v_id := COALESCE(p_new->>'id_cepa', p_old->>'id_cepa');
        WHEN 'MARIDAJE' THEN
            v_id := COALESCE(p_new->>'id_maridaje', p_old->>'id_maridaje');
        WHEN 'DEPARTAMENTO' THEN
            v_id := COALESCE(p_new->>'id_depto', p_old->>'id_depto');
        WHEN 'LOCALIDAD' THEN
            v_id := COALESCE(p_new->>'codigo_postal', p_old->>'codigo_postal');
        WHEN 'SALA_VENTA' THEN
            v_id := COALESCE(p_new->>'id_sala', p_old->>'id_sala');
        WHEN 'TRANSPORTISTA' THEN
            v_id := COALESCE(p_new->>'codigo', p_old->>'codigo');
        WHEN 'PERSONAL' THEN
            v_id := COALESCE(p_new->>'cuit', p_old->>'cuit');
        WHEN 'ENCARGADO' THEN
            v_id := COALESCE(p_new->>'cuit', p_old->>'cuit');
        WHEN 'EMPLEADO' THEN
            v_id := COALESCE(p_new->>'cuit', p_old->>'cuit');
        WHEN 'ANALISIS_CALIDAD' THEN
            v_id := COALESCE(p_new->>'id_analisis', p_old->>'id_analisis');
        ELSE
            v_id := 'unknown';
    END CASE;

    RETURN v_id;
END;
$$;

-- Trigger function genérica para auditoría (USA FUNCIONES AUXILIARES - NO ACCESO DIRECTO A COLUMNAS)
CREATE OR REPLACE FUNCTION fn_trg_auditoria_actividad()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_tabla VARCHAR(50) := TG_TABLE_NAME;
    v_operacion VARCHAR(10) := TG_OP;
    v_id_registro VARCHAR(100);
    v_datos_anteriores JSONB;
    v_datos_nuevos JSONB;
    v_descripcion TEXT;
BEGIN
    -- Convertir OLD y NEW a JSONB
    IF v_operacion IN ('UPDATE', 'DELETE') THEN
        v_datos_anteriores := to_jsonb(OLD);
    END IF;

    IF v_operacion IN ('INSERT', 'UPDATE') THEN
        v_datos_nuevos := to_jsonb(NEW);
    END IF;

    -- Obtener ID del registro usando función auxiliar (evita errores de columnas inexistentes)
    v_id_registro := fn_get_registro_id(v_tabla, v_operacion, v_datos_nuevos, v_datos_anteriores);

    -- Generar descripción legible
    v_descripcion := fn_generar_descripcion_actividad(v_tabla, v_operacion, v_id_registro, v_datos_anteriores, v_datos_nuevos);

    -- Insertar en tabla de auditoría
    INSERT INTO AUDITORIA_ACTIVIDAD (
        tabla_afectada,
        operacion,
        id_registro,
        datos_anteriores,
        datos_nuevos,
        usuario,
        fecha_hora,
        descripcion
    ) VALUES (
        v_tabla,
        v_operacion,
        v_id_registro,
        v_datos_anteriores,
        v_datos_nuevos,
        COALESCE(NULLIF(current_setting('app.current_user', true), ''), CURRENT_USER),
        CURRENT_TIMESTAMP,
        v_descripcion
    );

    RETURN NEW;
END;
$$;

-- Aplicar triggers a las tablas principales (DROP IF EXISTS para idempotencia)
DROP TRIGGER IF EXISTS trg_auditoria_vino ON VINO;
CREATE TRIGGER trg_auditoria_vino
AFTER INSERT OR UPDATE OR DELETE ON VINO
FOR EACH ROW EXECUTE FUNCTION fn_trg_auditoria_actividad();

DROP TRIGGER IF EXISTS trg_auditoria_cliente ON CLIENTE;
CREATE TRIGGER trg_auditoria_cliente
AFTER INSERT OR UPDATE OR DELETE ON CLIENTE
FOR EACH ROW EXECUTE FUNCTION fn_trg_auditoria_actividad();

DROP TRIGGER IF EXISTS trg_auditoria_comprobante ON COMPROBANTE;
CREATE TRIGGER trg_auditoria_comprobante
AFTER INSERT OR UPDATE OR DELETE ON COMPROBANTE
FOR EACH ROW EXECUTE FUNCTION fn_trg_auditoria_actividad();

DROP TRIGGER IF EXISTS trg_auditoria_ingreso ON INGRESO;
CREATE TRIGGER trg_auditoria_ingreso
AFTER INSERT OR UPDATE OR DELETE ON INGRESO
FOR EACH ROW EXECUTE FUNCTION fn_trg_auditoria_actividad();

DROP TRIGGER IF EXISTS trg_auditoria_transferencia ON TRANSFERENCIA;
CREATE TRIGGER trg_auditoria_transferencia
AFTER INSERT OR UPDATE OR DELETE ON TRANSFERENCIA
FOR EACH ROW EXECUTE FUNCTION fn_trg_auditoria_actividad();

DROP TRIGGER IF EXISTS trg_auditoria_renglon_ingreso ON RENGLON_INGRESO;
CREATE TRIGGER trg_auditoria_renglon_ingreso
AFTER INSERT OR UPDATE OR DELETE ON RENGLON_INGRESO
FOR EACH ROW EXECUTE FUNCTION fn_trg_auditoria_actividad();

DROP TRIGGER IF EXISTS trg_auditoria_renglon_transferencia ON RENGLON_TRANSFERENCIA;
CREATE TRIGGER trg_auditoria_renglon_transferencia
AFTER INSERT OR UPDATE OR DELETE ON RENGLON_TRANSFERENCIA
FOR EACH ROW EXECUTE FUNCTION fn_trg_auditoria_actividad();

DROP TRIGGER IF EXISTS trg_auditoria_renglon_comprobante ON RENGLON_COMPROBANTE;
CREATE TRIGGER trg_auditoria_renglon_comprobante
AFTER INSERT OR UPDATE OR DELETE ON RENGLON_COMPROBANTE
FOR EACH ROW EXECUTE FUNCTION fn_trg_auditoria_actividad();

DROP TRIGGER IF EXISTS trg_auditoria_stock_deposito ON STOCK_DEPOSITO;
CREATE TRIGGER trg_auditoria_stock_deposito
AFTER INSERT OR UPDATE ON STOCK_DEPOSITO
FOR EACH ROW EXECUTE FUNCTION fn_trg_auditoria_actividad();

DROP TRIGGER IF EXISTS trg_auditoria_stock_sala ON STOCK_SALA;
CREATE TRIGGER trg_auditoria_stock_sala
AFTER INSERT OR UPDATE ON STOCK_SALA
FOR EACH ROW EXECUTE FUNCTION fn_trg_auditoria_actividad();

DROP TRIGGER IF EXISTS trg_auditoria_bodega ON BODEGA;
CREATE TRIGGER trg_auditoria_bodega
AFTER INSERT OR UPDATE OR DELETE ON BODEGA
FOR EACH ROW EXECUTE FUNCTION fn_trg_auditoria_actividad();

DROP TRIGGER IF EXISTS trg_auditoria_finca ON FINCA;
CREATE TRIGGER trg_auditoria_finca
AFTER INSERT OR UPDATE OR DELETE ON FINCA
FOR EACH ROW EXECUTE FUNCTION fn_trg_auditoria_actividad();

DROP TRIGGER IF EXISTS trg_auditoria_parcela ON PARCELA;
CREATE TRIGGER trg_auditoria_parcela
AFTER INSERT OR UPDATE OR DELETE ON PARCELA
FOR EACH ROW EXECUTE FUNCTION fn_trg_auditoria_actividad();

DROP TRIGGER IF EXISTS trg_auditoria_lote_uva ON LOTE_UVA;
CREATE TRIGGER trg_auditoria_lote_uva
AFTER INSERT OR UPDATE OR DELETE ON LOTE_UVA
FOR EACH ROW EXECUTE FUNCTION fn_trg_auditoria_actividad();

DROP TRIGGER IF EXISTS trg_auditoria_cepa ON CEPA;
CREATE TRIGGER trg_auditoria_cepa
AFTER INSERT OR UPDATE OR DELETE ON CEPA
FOR EACH ROW EXECUTE FUNCTION fn_trg_auditoria_actividad();

DROP TRIGGER IF EXISTS trg_auditoria_maridaje ON MARIDAJE;
CREATE TRIGGER trg_auditoria_maridaje
AFTER INSERT OR UPDATE OR DELETE ON MARIDAJE
FOR EACH ROW EXECUTE FUNCTION fn_trg_auditoria_actividad();

DROP TRIGGER IF EXISTS trg_auditoria_departamento ON DEPARTAMENTO;
CREATE TRIGGER trg_auditoria_departamento
AFTER INSERT OR UPDATE OR DELETE ON DEPARTAMENTO
FOR EACH ROW EXECUTE FUNCTION fn_trg_auditoria_actividad();

DROP TRIGGER IF EXISTS trg_auditoria_localidad ON LOCALIDAD;
CREATE TRIGGER trg_auditoria_localidad
AFTER INSERT OR UPDATE OR DELETE ON LOCALIDAD
FOR EACH ROW EXECUTE FUNCTION fn_trg_auditoria_actividad();

DROP TRIGGER IF EXISTS trg_auditoria_sala_venta ON SALA_VENTA;
CREATE TRIGGER trg_auditoria_sala_venta
AFTER INSERT OR UPDATE OR DELETE ON SALA_VENTA
FOR EACH ROW EXECUTE FUNCTION fn_trg_auditoria_actividad();

DROP TRIGGER IF EXISTS trg_auditoria_transportista ON TRANSPORTISTA;
CREATE TRIGGER trg_auditoria_transportista
AFTER INSERT OR UPDATE OR DELETE ON TRANSPORTISTA
FOR EACH ROW EXECUTE FUNCTION fn_trg_auditoria_actividad();

DROP TRIGGER IF EXISTS trg_auditoria_personal ON PERSONAL;
CREATE TRIGGER trg_auditoria_personal
AFTER INSERT OR UPDATE OR DELETE ON PERSONAL
FOR EACH ROW EXECUTE FUNCTION fn_trg_auditoria_actividad();

DROP TRIGGER IF EXISTS trg_auditoria_encargado ON ENCARGADO;
CREATE TRIGGER trg_auditoria_encargado
AFTER INSERT OR UPDATE OR DELETE ON ENCARGADO
FOR EACH ROW EXECUTE FUNCTION fn_trg_auditoria_actividad();

DROP TRIGGER IF EXISTS trg_auditoria_empleado ON EMPLEADO;
CREATE TRIGGER trg_auditoria_empleado
AFTER INSERT OR UPDATE OR DELETE ON EMPLEADO
FOR EACH ROW EXECUTE FUNCTION fn_trg_auditoria_actividad();

DROP TRIGGER IF EXISTS trg_auditoria_analisis_calidad ON ANALISIS_CALIDAD;
CREATE TRIGGER trg_auditoria_analisis_calidad
AFTER INSERT OR UPDATE OR DELETE ON ANALISIS_CALIDAD
FOR EACH ROW EXECUTE FUNCTION fn_trg_auditoria_actividad();