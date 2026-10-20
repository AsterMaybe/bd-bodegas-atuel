
-- Tipos de datos propios, Domain y ENUM

CREATE DOMAIN cuit_dom AS CHAR(11);

CREATE TYPE estado_documento AS ENUM ('en_confeccion', 'terminado', 'procesado');
CREATE TYPE tipo_vino AS ENUM ('tinto', 'blanco', 'rosado', 'espumante');
CREATE TYPE tipo_cepa AS ENUM ('tinta', 'blanca');


-- TABLAS FUERTES Y DE CATÁLOGO (SIN DEPENDENCIAS)


CREATE TABLE PERSONAL (
    cuit cuit_dom,
    nombre VARCHAR(100) NOT NULL,
    fecha_ingreso DATE NOT NULL,
    salario NUMERIC(10,2) NOT NULL,
    PRIMARY KEY (cuit)
);

CREATE TABLE BODEGA (
    cuit cuit_dom,
    razon_social VARCHAR(100) NOT NULL,
    domicilio VARCHAR(150) NOT NULL,
    PRIMARY KEY (cuit)
);

CREATE TABLE CEPA (
    id_cepa SERIAL,
    nombre VARCHAR(50) NOT NULL,
    tipo tipo_cepa NOT NULL,
    PRIMARY KEY (id_cepa)
);

CREATE TABLE MARIDAJE (
    id_maridaje SERIAL,
    nombre VARCHAR(100) NOT NULL,
    temp_servicio NUMERIC(4,2) NOT NULL,
    PRIMARY KEY (id_maridaje)
);

CREATE TABLE TRANSPORTISTA (
    codigo SERIAL,
    razon_social VARCHAR(100) NOT NULL,
    cuit cuit_dom NOT NULL,
    email VARCHAR(100),
    telefono VARCHAR(20),
    domicilio VARCHAR(150),
    PRIMARY KEY (codigo)
);

CREATE TABLE DEPARTAMENTO (
    id_depto SERIAL,
    nombre_depto VARCHAR(100) NOT NULL,
    provincia VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_depto)
);


-- TABLAS CON DEPENDENCIAS DE PRIMER Y SEGUNDO NIVEL


CREATE TABLE ENCARGADO (
    cuit cuit_dom,
    PRIMARY KEY (cuit),
    FOREIGN KEY (cuit) REFERENCES PERSONAL(cuit)
);

CREATE TABLE LOCALIDAD (
    codigo_postal VARCHAR(10),
    provincia VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    cuit_encargado cuit_dom NOT NULL,
    PRIMARY KEY (codigo_postal),
    FOREIGN KEY (cuit_encargado) REFERENCES ENCARGADO(cuit)
);

CREATE TABLE SALA_VENTA (
    id_sala SERIAL,
    numero INTEGER NOT NULL,
    calle VARCHAR(100) NOT NULL,
    dia_de_cierre SMALLINT,
    codigo_postal VARCHAR(10) NOT NULL,
    PRIMARY KEY (id_sala),
    FOREIGN KEY (codigo_postal) REFERENCES LOCALIDAD(codigo_postal)
);

CREATE TABLE EMPLEADO (
    cuit cuit_dom,
    id_sala INTEGER NOT NULL,
    PRIMARY KEY (cuit),
    FOREIGN KEY (cuit) REFERENCES PERSONAL(cuit),
    FOREIGN KEY (id_sala) REFERENCES SALA_VENTA(id_sala)
);

CREATE TABLE TRANSPORTISTA_LOCALIDAD (
    codigo_transp INTEGER,
    codigo_postal VARCHAR(10),
    PRIMARY KEY (codigo_transp, codigo_postal),
    FOREIGN KEY (codigo_transp) REFERENCES TRANSPORTISTA(codigo),
    FOREIGN KEY (codigo_postal) REFERENCES LOCALIDAD(codigo_postal)
);

CREATE TABLE FINCA (
    id_finca SERIAL,
    nombre VARCHAR(100) NOT NULL,
    superficie_ha NUMERIC(10,2) NOT NULL,
    id_depto INTEGER NOT NULL,
    PRIMARY KEY (id_finca),
    FOREIGN KEY (id_depto) REFERENCES DEPARTAMENTO(id_depto)
);

CREATE TABLE PARCELA (
    nro_parcela INTEGER,
    id_finca INTEGER,
    superficie NUMERIC(10,2) NOT NULL,
    año_plantacion INTEGER NOT NULL,
    id_cepa INTEGER NOT NULL,
    PRIMARY KEY (nro_parcela, id_finca),
    FOREIGN KEY (id_finca) REFERENCES FINCA(id_finca),
    FOREIGN KEY (id_cepa) REFERENCES CEPA(id_cepa)
);

CREATE TABLE LOTE_UVA (
    nro_lote SERIAL,
    campaña INTEGER NOT NULL,
    fecha_cosecha DATE NOT NULL,
    kg NUMERIC(10,2) NOT NULL,
    nro_parcela INTEGER NOT NULL,
    id_finca INTEGER NOT NULL,
    cuit_bodega cuit_dom NOT NULL,
    PRIMARY KEY (nro_lote),
    FOREIGN KEY (nro_parcela, id_finca) REFERENCES PARCELA(nro_parcela, id_finca),
    FOREIGN KEY (cuit_bodega) REFERENCES BODEGA(cuit)
);

CREATE TABLE ANALISIS_CALIDAD (
    id_analisis SERIAL,
    fecha TIMESTAMP NOT NULL,
    brix NUMERIC(5,2) NOT NULL,
    ph NUMERIC(4,2) NOT NULL,
    acidez NUMERIC(5,2) NOT NULL,
    nro_lote INTEGER NOT NULL,
    PRIMARY KEY (id_analisis),
    FOREIGN KEY (nro_lote) REFERENCES LOTE_UVA(nro_lote)
);

CREATE TABLE VINO (
    codigo_vino SERIAL,
    nombre VARCHAR(100) NOT NULL,
    tipo tipo_vino NOT NULL,
    añada INTEGER NOT NULL,
    volumen_ml INTEGER NOT NULL,
    graduacion NUMERIC(4,2) NOT NULL,
    precio NUMERIC(10,2) NOT NULL,
    cuit_bodega cuit_dom NOT NULL,
    PRIMARY KEY (codigo_vino),
    FOREIGN KEY (cuit_bodega) REFERENCES BODEGA(cuit)
);

CREATE TABLE COMPOSICION_VINO (
    codigo_vino INTEGER,
    id_cepa INTEGER,
    porcentaje NUMERIC(5,2) NOT NULL,
    PRIMARY KEY (codigo_vino, id_cepa),
    FOREIGN KEY (codigo_vino) REFERENCES VINO(codigo_vino),
    FOREIGN KEY (id_cepa) REFERENCES CEPA(id_cepa)
);

CREATE TABLE VINO_MARIDAJE (
    codigo_vino INTEGER,
    id_maridaje INTEGER,
    PRIMARY KEY (codigo_vino, id_maridaje),
    FOREIGN KEY (codigo_vino) REFERENCES VINO(codigo_vino),
    FOREIGN KEY (id_maridaje) REFERENCES MARIDAJE(id_maridaje)
);

CREATE TABLE CLIENTE (
    id_cliente SERIAL,
    nombre_razon VARCHAR(150) NOT NULL,
    tipo_doc VARCHAR(10) NOT NULL,
    nro_doc VARCHAR(20) NOT NULL,
    direccion VARCHAR(150),
    fecha_alta DATE NOT NULL,
    descuento NUMERIC(5,2) NOT NULL,
    codigo_postal VARCHAR(10) NOT NULL,
    PRIMARY KEY (id_cliente),
    FOREIGN KEY (codigo_postal) REFERENCES LOCALIDAD(codigo_postal)
);


-- JERARQUÍA DE CLIENTES (SUBCLASES)


CREATE TABLE SOCIO_CLUB (
    id_cliente INTEGER,
    PRIMARY KEY (id_cliente),
    FOREIGN KEY (id_cliente) REFERENCES CLIENTE(id_cliente)
);

CREATE TABLE DISTRIBUIDOR (
    id_cliente INTEGER,
    zona_cobertura VARCHAR(100) NOT NULL,
    nro_habilitacion VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_cliente),
    FOREIGN KEY (id_cliente) REFERENCES CLIENTE(id_cliente)
);

CREATE TABLE EXPORTADOR (
    id_cliente INTEGER,
    pais_destino VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_cliente),
    FOREIGN KEY (id_cliente) REFERENCES CLIENTE(id_cliente)
);

CREATE TABLE PERMISO_EXPORTADOR (
    codigo_permiso VARCHAR(50),
    fecha_emision DATE NOT NULL,
    fecha_venc DATE NOT NULL,
    id_cliente INTEGER NOT NULL,
    PRIMARY KEY (codigo_permiso),
    FOREIGN KEY (id_cliente) REFERENCES EXPORTADOR(id_cliente)
);


-- STOCK Y MOVIMIENTOS LOGÍSTICOS


CREATE TABLE STOCK_DEPOSITO (
    codigo_vino INTEGER,
    cantidad INTEGER NOT NULL,
    PRIMARY KEY (codigo_vino),
    FOREIGN KEY (codigo_vino) REFERENCES VINO(codigo_vino)
);

CREATE TABLE STOCK_SALA (
    id_sala INTEGER,
    codigo_vino INTEGER,
    cantidad INTEGER NOT NULL,
    PRIMARY KEY (id_sala, codigo_vino),
    FOREIGN KEY (id_sala) REFERENCES SALA_VENTA(id_sala),
    FOREIGN KEY (codigo_vino) REFERENCES VINO(codigo_vino)
);

CREATE TABLE COMPROBANTE (
    nro_comprob SERIAL,
    fecha TIMESTAMP NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,
    descuento NUMERIC(12,2) NOT NULL,
    total NUMERIC(12,2) NOT NULL,
    id_cliente INTEGER NOT NULL,
    id_sala INTEGER NOT NULL,
    PRIMARY KEY (nro_comprob),
    FOREIGN KEY (id_cliente) REFERENCES CLIENTE(id_cliente),
    FOREIGN KEY (id_sala) REFERENCES SALA_VENTA(id_sala)
);

CREATE TABLE RENGLON_COMPROBANTE (
    nro_comprob INTEGER,
    codigo_vino INTEGER,
    cantidad INTEGER NOT NULL,
    precio_unitario NUMERIC(10,2) NOT NULL,
    descuento NUMERIC(10,2) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,
    PRIMARY KEY (nro_comprob, codigo_vino),
    FOREIGN KEY (nro_comprob) REFERENCES COMPROBANTE(nro_comprob),
    FOREIGN KEY (codigo_vino) REFERENCES VINO(codigo_vino)
);

CREATE TABLE INGRESO (
    id_documento SERIAL,
    fecha DATE NOT NULL,
    estado estado_documento NOT NULL,
    cuit_bodega cuit_dom NOT NULL,
    codigo_transp INTEGER NOT NULL,
    PRIMARY KEY (id_documento),
    FOREIGN KEY (cuit_bodega) REFERENCES BODEGA(cuit),
    FOREIGN KEY (codigo_transp) REFERENCES TRANSPORTISTA(codigo)
);

CREATE TABLE RENGLON_INGRESO (
    id_documento INTEGER,
    codigo_vino INTEGER,
    cantidad INTEGER NOT NULL,
    PRIMARY KEY (id_documento, codigo_vino),
    FOREIGN KEY (id_documento) REFERENCES INGRESO(id_documento),
    FOREIGN KEY (codigo_vino) REFERENCES VINO(codigo_vino)
);

CREATE TABLE TRANSFERENCIA (
    id_documento SERIAL,
    fecha DATE NOT NULL,
    estado estado_documento NOT NULL,
    id_sala INTEGER NOT NULL,
    PRIMARY KEY (id_documento),
    FOREIGN KEY (id_sala) REFERENCES SALA_VENTA(id_sala)
);

CREATE TABLE RENGLON_TRANSFERENCIA (
    id_documento INTEGER,
    codigo_vino INTEGER,
    cantidad INTEGER NOT NULL,
    PRIMARY KEY (id_documento, codigo_vino),
    FOREIGN KEY (id_documento) REFERENCES TRANSFERENCIA(id_documento),
    FOREIGN KEY (codigo_vino) REFERENCES VINO(codigo_vino)
);

CREATE TABLE AUDITORIA_PRECIO (
    id_auditoria SERIAL,
    precio_anterior NUMERIC(10,2) NOT NULL,
    precio_nuevo NUMERIC(10,2) NOT NULL,
    fecha_hora TIMESTAMP NOT NULL,
    usuario VARCHAR(50) NOT NULL,
    codigo_vino INTEGER NOT NULL,
    PRIMARY KEY (id_auditoria),
    FOREIGN KEY (codigo_vino) REFERENCES VINO(codigo_vino)
);