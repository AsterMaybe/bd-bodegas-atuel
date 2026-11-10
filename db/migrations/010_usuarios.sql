-- Migración 010: Tabla de usuarios del sistema para autenticación
-- Registra los usuarios autorizados para acceder al sistema con sus roles

-- Tipo de dato para roles de usuario
CREATE TYPE rol_usuario AS ENUM ('administrador', 'empleado');

-- Tabla de usuarios del sistema
CREATE TABLE USUARIO (
    id_usuario SERIAL,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol rol_usuario NOT NULL DEFAULT 'empleado',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_DATE,
    PRIMARY KEY (id_usuario)
);

-- Comentarios en la tabla
COMMENT ON TABLE USUARIO IS 'Usuarios del sistema con acceso al aplicativo';
COMMENT ON COLUMN USUARIO.id_usuario IS 'Identificador único del usuario';
COMMENT ON COLUMN USUARIO.nombre IS 'Nombre completo del usuario';
COMMENT ON COLUMN USUARIO.email IS 'Correo electrónico único para login';
COMMENT ON COLUMN USUARIO.password_hash IS 'Hash del contraseña (bcrypt)';
COMMENT ON COLUMN USUARIO.rol IS 'Rol del usuario: administrador o empleado';
COMMENT ON COLUMN USUARIO.activo IS 'Indica si el usuario está activo en el sistema';
COMMENT ON COLUMN USUARIO.fecha_creacion IS 'Fecha de creación del usuario';