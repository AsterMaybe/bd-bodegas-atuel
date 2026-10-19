-- -----------------------------------------------------------------------------
-- 1. CREACIÓN DE LOS TRES ROLES DEL SISTEMA (De forma idempotente)
-- -----------------------------------------------------------------------------

DO $$
BEGIN
    -- Rol 1: Propietario del esquema (ejecuta migraciones DDL, nunca lo usa la API)
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_owner') THEN
        CREATE ROLE app_owner LOGIN PASSWORD 'cambiar_por_un_secreto';
    END IF;

    -- Rol 2: Lectura y escritura para la API REST (privilegios mínimos operativos)
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_rw') THEN
        CREATE ROLE app_rw LOGIN PASSWORD 'cambiar_por_un_secreto';
    END IF;

    -- Rol 3: Solo lectura para reportes, consultas analíticas y BI
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_ro') THEN
        CREATE ROLE app_ro LOGIN PASSWORD 'cambiar_por_un_secreto';
    END IF;
END
$$;


-- -----------------------------------------------------------------------------
-- 2. REVOCACIÓN DE PRIVILEGIOS PÚBLICOS POR DEFECTO
-- -----------------------------------------------------------------------------
-- Se quitan los permisos implícitos del rol PUBLIC para que ningún usuario
-- pueda crear objetos ni leer datos sin autorización explícita.

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM PUBLIC;


-- -----------------------------------------------------------------------------
-- 3. PRIVILEGIOS DEL ROL PROPIETARIO (app_owner)
-- -----------------------------------------------------------------------------
-- Posee control total sobre el esquema para aplicar migraciones y mantenimiento.

GRANT ALL PRIVILEGES ON SCHEMA public TO app_owner;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_owner;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_owner;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO app_owner;


-- -----------------------------------------------------------------------------
-- 4. PRIVILEGIOS DEL ROL DE LA API REST (app_rw - Lectura/Escritura)
-- -----------------------------------------------------------------------------
-- Permite usar el esquema (sin permiso CREATE para impedir DDL desde la API)

GRANT USAGE ON SCHEMA public TO app_rw;

-- Permisos DML sobre tablas y vistas del esquema
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_rw;

-- Protección adicional de auditoría (RN-13):
-- La API puede leer AUDITORIA_PRECIO y el trigger puede insertar registros en ella,
-- pero se prohíbe modificar o borrar el historial de auditoría de precios.

REVOKE UPDATE, DELETE ON TABLE AUDITORIA_PRECIO FROM app_rw;

-- Permiso para avanzar y consultar las secuencias creadas por las columnas SERIAL
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_rw;

-- Permiso para invocar las funciones de cálculo y procedimientos transaccionales
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO app_rw;


-- -----------------------------------------------------------------------------
-- 5. PRIVILEGIOS DEL ROL DE REPORTES (app_ro - Solo Lectura)
-- -----------------------------------------------------------------------------
-- Solo puede acceder al esquema y consultar tablas y vistas (006_vistas.sql)

GRANT USAGE ON SCHEMA public TO app_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_ro;


-- -----------------------------------------------------------------------------
-- 6. PRIVILEGIOS POR DEFECTO PARA OBJETOS FUTUROS (ALTER DEFAULT PRIVILEGES)
-- -----------------------------------------------------------------------------
-- Garantiza que si se crean nuevas vistas, tablas, secuencias o rutinas en
-- migraciones posteriores, los roles mantengan su nivel de acceso sin brechas.

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_rw;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO app_rw;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT EXECUTE ON ROUTINES TO app_rw;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO app_ro;