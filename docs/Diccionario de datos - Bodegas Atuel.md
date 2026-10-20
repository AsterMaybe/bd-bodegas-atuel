# Diccionario de Datos: Bodegas del Atuel

## 1\. Tipos de datos propios en PosgreSQL (DOMINIO y ENUM)

* **`cuit_dom` (DOMINIO):** Basado en `CHAR(11)`. Restricción: `CHECK (VALUE ~ '^[0-9]{11}$')`. Valida que el CUIT contenga exactamente 11 dígitos numéricos sin guiones.

* **`estado_documento` (ENUM):** Valores permitidos: `'en_confeccion'`, `'terminado'`, `'procesado'`. Utilizado en ingresos y transferencias.

* **`tipo_vino` (ENUM):** Valores permitidos: `'tinto'`, `'blanco'`, `'rosado'`, `'espumante'`.

* **`tipo_cepa` (ENUM):** Valores permitidos: `'tinta'`, `'blanca'`.

## 2\. Personal y Locaciones

### Tabla: PERSONAL

| Columna | Tipo de Dato | Nulo | Restricciones | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| `cuit` | `cuit_dom` | NO | PK | Identificador único del personal (CUIT). |
| `nombre` | `VARCHAR(100)` | NO |  | Nombre completo del empleado/encargado. |
| `fecha_ingreso` | `DATE` | NO |  | Fecha en la que ingresó a la empresa. |
| `salario` | `NUMERIC(10,2)` | NO | CHECK (\> 0\) | Salario bruto. Nunca usar FLOAT. |

&nbsp;

### Tabla: ENCARGADO

| Columna | Tipo de Dato | Nulo | Restricciones | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| `cuit` | `cuit_dom` | NO | PK, FK \-\> PERSONAL | CUIT del encargado regional. |

&nbsp;

### Tabla: EMPLEADO

| Columna | Tipo de Dato | Nulo | Restricciones | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| `cuit` | `cuit_dom` | NO | PK, FK \-\> PERSONAL | CUIT del empleado de sala. |
| `id_sala` | `INTEGER` | NO | FK \-\> SALA\_VENTA | Sala en la que trabaja actualmente. |

&nbsp;

### Tabla: LOCALIDAD

| Columna | Tipo de Dato | Nulo | Restricciones | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| `codigo_postal` | `VARCHAR(10)` | NO | PK | Código postal de la localidad. |
| `provincia` | `VARCHAR(50)` | NO |  | Nombre de la provincia. |
| `nombre` | `VARCHAR(100)` | NO |  | Nombre de la ciudad o localidad. |
| `cuit_encargado` | `cuit_dom` | NO | FK \-\> ENCARGADO | Encargado regional asignado (Uno por loc.). |

&nbsp;

### Tabla: SALA\_VENTA

| Columna | Tipo de Dato | Nulo | Restricciones | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| `id_sala` | `SERIAL` | NO | PK | Identificador autogenerado de la sala. |
| `numero` | `INTEGER` | NO |  | Número de la calle de la sucursal. |
| `calle` | `VARCHAR(100)` | NO |  | Nombre de la calle. |
| `dia_de_cierre` | `SMALLINT` | SÍ | CHECK (1 a 7\) | Día de descanso (1=Lunes, 7=Domingo). |
| `codigo_postal` | `VARCHAR(10)` | NO | FK \-\> LOCALIDAD | Localidad donde se ubica. |

&nbsp;

## 3\. Catálogos Fijos

### Tabla: BODEGA

| Columna | Tipo de Dato | Nulo | Restricciones | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| `cuit` | `cuit_dom` | NO | PK | CUIT de la bodega. |
| `razon_social` | `VARCHAR(100)` | NO |  | Razón social legal. |
| `domicilio` | `VARCHAR(150)` | NO |  | Domicilio completo. |

&nbsp;

### Tabla: CEPA

| Columna | Tipo de Dato | Nulo | Restricciones | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| `id_cepa` | `SERIAL` | NO | PK | Identificador interno de la cepa. |
| `nombre` | `VARCHAR(50)` | NO | UNIQUE | Nombre (ej: Malbec, Syrah). |
| `tipo` | `tipo_cepa` | NO |  | Clasificación (Tinta o Blanca). |

&nbsp;

### Tabla: MARIDAJE

| Columna | Tipo de Dato | Nulo | Restricciones | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| `id_maridaje` | `SERIAL` | NO | PK | ID autogenerado. |
| `nombre` | `VARCHAR(100)` | NO |  | Ej: 'Carnes rojas', 'Quesos duros'. |
| `temp_servicio` | `NUMERIC(4,2)` | NO |  | Temperatura recomendada en grados Celsius. |

&nbsp;

### Tabla: TRANSPORTISTA

| Columna | Tipo de Dato | Nulo | Restricciones | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| `codigo` | `SERIAL` | NO | PK | Código interno del transportista. |
| `razon_social` | `VARCHAR(100)` | NO |  | Nombre de la empresa de transporte. |
| `cuit` | `cuit_dom` | NO | UNIQUE | CUIT de facturación. |
| `email` | `VARCHAR(100)` | SÍ |  | Correo de contacto. |
| `telefono` | `VARCHAR(20)` | SÍ |  | Teléfono de contacto. |
| `domicilio` | `VARCHAR(150)` | SÍ |  | Dirección física. |

&nbsp;

### Tabla: TRANSPORTISTA\_LOCALIDAD (N:M)

| Columna | Tipo de Dato | Nulo | Restricciones | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| `codigo_transp.` | `INTEGER` | NO | PK, FK \-\> TRANSPORT. | Empresa de transporte. |
| `codigo_postal` | `VARCHAR(10)` | NO | PK, FK \-\> LOCALIDAD | Localidad a la que tiene alcance/cobertura. |

&nbsp;

## 4\. Producción Agrícola (Uvas)

### Tabla: DEPARTAMENTO

| Columna | Tipo de Dato | Nulo | Restricciones | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| `id_depto` | `SERIAL` | NO | PK | ID interno. |
| `nombre_depto` | `VARCHAR(100)` | NO |  | Nombre (Ej: San Rafael, Luján de Cuyo). |
| `provincia` | `VARCHAR(50)` | NO |  | Provincia del departamento. |

&nbsp;

### Tabla: FINCA

| Columna | Tipo de Dato | Nulo | Restricciones | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| `id_finca` | `SERIAL` | NO | PK | ID autogenerado de la finca. |
| `nombre` | `VARCHAR(100)` | NO |  | Nombre comercial de la finca. |
| `superficie_ha` | `NUMERIC(10,2)` | NO | CHECK (\> 0\) | Hectáreas totales. |
| `id_depto` | `INTEGER` | NO | FK \-\> DEPARTAMENTO | Ubicación geográfica normalizada. |

&nbsp;

### Tabla: PARCELA (Entidad Débil)

| Columna | Tipo de Dato | Nulo | Restricciones | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| `nro_parcela` | `INTEGER` | NO | PK | Número identificador dentro de la finca. |
| `id_finca` | `INTEGER` | NO | PK, FK \-\> FINCA | Finca a la que pertenece. |
| `superficie` | `NUMERIC(10,2)` | NO | CHECK (\> 0\) | Hectáreas específicas de la parcela. |
| `año_plantacion` | `INTEGER` | NO | CHECK (\>= 1800\) | Año de siembra del viñedo. |
| `id_cepa` | `INTEGER` | NO | FK \-\> CEPA | Variedad plantada. |

&nbsp;

### Tabla: LOTE\_UVA

| Columna | Tipo de Dato | Nulo | Restricciones | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| `nro_lote` | `SERIAL` | NO | PK | ID autogenerado de la cosecha. |
| `campaña` | `INTEGER` | NO | CHECK (\> 0 | Año de la vendimia. |
| `fecha_cosecha` | `DATE` | NO |  | Fecha exacta de la recolección. |
| `kg` | `NUMERIC(10,2)` | NO | CHECK (\> 0\) | Rendimiento bruto de uva. |
| `nro_parcela` | `INTEGER` | NO | FK \-\> PARCELA | (Con id\_finca) Parcela cosechada. UNIQUE\*. |
| `id_finca` | `INTEGER` | NO | FK \-\> PARCELA | (Con nro\_parcela). UNIQUE\*. |
| `cuit_bodega` | `cuit_dom` | NO | FK \-\> BODEGA | Bodega de destino para elaborar el vino. |
| (Restriccion de tabla) | \- | \- | UNIQUE(compuesta)\* | UNIQUE(campaña, nro\_parcela, id\_finca) |

&nbsp;

> *La restricción UNIQUE abarca `(campaña, nro_parcela, id_finca)` para cumplir la regla RN-04.*

### Tabla: ANALISIS\_CALIDAD

| Columna | Tipo de Dato | Nulo | Restricciones | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| `id_analisis` | `SERIAL` | NO | PK | Código del análisis. |
| `fecha` | `TIMESTAMP` | NO |  | Momento del testeo. |
| `brix` | `NUMERIC(5,2)` | NO | CHECK (\> 0\) | Grados Brix (azúcar). |
| `ph` | `NUMERIC(4,2)` | NO | CHECK (\> 0\) | Potencial de Hidrógeno. |
| `acidez` | `NUMERIC(5,2)` | NO | CHECK (\> 0\) | Acidez total en g/L. |
| `nro_lote` | `INTEGER` | NO | FK \-\> LOTE\_UVA | Lote analizado. |

&nbsp;

## 5\. El Producto (Vinos)

### Tabla: VINO

| Columna | Tipo de Dato | Nulo | Restricciones | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| `codigo_vino` | `SERIAL` | NO | PK | Identificador comercial. |
| `nombre` | `VARCHAR(100)` | NO | UNIQUE (Compuesta)\* | Nombre del vino (Ej: Malbec Reserva). |
| `tipo` | `tipo_vino` | NO |  | Tinto, blanco, rosado o espumante. |
| `añada` | `INTEGER` | NO | UNIQUE (Compuesta)\* | Año de elaboración. |
| `volumen_ml` | `INTEGER` | NO | UNIQUE (Compuesta)\* | Ej: 750, 1500\. |
| `graduacion` | `NUMERIC(4,2)` | NO | CHECK (BETWEEN 5 AND 20\) | Alcohol (RN-15). |
| `precio` | `NUMERIC(10,2)` | NO | CHECK (\> 0\) | Precio unitario universal (RN-01). |
| `cuit_bodega` | `cuit_dom` | NO | FK \-\> BODEGA | Bodega productora. |

&nbsp;

> *La restricción UNIQUE abarca `(nombre, añada, volumen_ml)`.*

### Tabla: COMPOSICION\_VINO (N:M)

| Columna | Tipo de Dato | Nulo | Restricciones | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| `codigo_vino` | `INTEGER` | NO | PK, FK \-\> VINO | Vino compuesto. |
| `id_cepa` | `INTEGER` | NO | PK, FK \-\> CEPA | Cepa participante en el corte. |
| `porcentaje` | `NUMERIC(5,2)` | NO | CHECK (\> 0 Y \<= 100\) | Peso relativo. Un trigger valida sum(100). |

&nbsp;

### Tabla: VINO\_MARIDAJE (N:M)

| Columna | Tipo de Dato | Nulo | Restricciones | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| `codigo_vino` | `INTEGER` | NO | PK, FK \-\> VINO |  |
| `id_maridaje` | `INTEGER` | NO | PK, FK \-\> MARIDAJE |  |

&nbsp;

## 6\. Jerarquía de Clientes

### Tabla: CLIENTE (Superclase)

| Columna | Tipo de Dato | Nulo | Restricciones | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| `id_cliente` | `SERIAL` | NO | PK | Identificador único de sistema. |
| `nombre_razon` | `VARCHAR(150)` | NO |  | Apellido y Nombre o Razón Social. |
| `tipo_doc` | `VARCHAR(10)` | NO |  | Ej: DNI, CUIT. |
| `nro_doc` | `VARCHAR(20)` | NO | UNIQUE | Número de identificación. |
| `direccion` | `VARCHAR(150)` | SÍ |  | Calle y número. |
| `fecha_alta` | `DATE` | NO | DEFAULT CURRENT\_DATE | Fecha de registro. |
| `descuento` | `NUMERIC(5,2)` | NO | CHECK (\>= 0\) | Porcentaje de bonificación base. |
| `codigo_postal` | `VARCHAR(10)` | NO | FK \-\> LOCALIDAD | Ciudad de residencia/operación. |

&nbsp;

### Tabla: SOCIO\_CLUB (Subclase)

| Columna | Tipo de Dato | Nulo | Restricciones | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| `id_cliente` | `INTEGER` | NO | PK, FK \-\> CLIENTE | Vincula 1:1 con el cliente base. |

&nbsp;

### Tabla: DISTRIBUIDOR (Subclase)

| Columna | Tipo de Dato | Nulo | Restricciones | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| `id_cliente` | `INTEGER` | NO | PK, FK \-\> CLIENTE | Vincula 1:1 con el cliente base. |
| `zona_cobertura` | `VARCHAR(100)` | NO |  | Territorio de distribución asignado. |
| `nro_habilitacion` | `VARCHAR(50)` | NO | UNIQUE | Permiso comercial / RENSPA. |

&nbsp;

### Tabla: EXPORTADOR (Subclase)

| Columna | Tipo de Dato | Nulo | Restricciones | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| `id_cliente` | `INTEGER` | NO | PK, FK \-\> CLIENTE | Vincula 1:1 con el cliente base. |
| `pais_destino` | `VARCHAR(50)` | NO |  | Mercado principal exterior. |

&nbsp;

### Tabla: PERMISO\_EXPORTADOR

| Columna | Tipo de Dato | Nulo | Restricciones | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| `codigo_permiso` | `VARCHAR(50)` | NO | PK | Identificador del certificado emitido. |
| `fecha_emision` | `DATE` | NO |  |  |
| `fecha_venc` | `DATE` | NO | CHECK (venc \> emision) | Valida que expire después de la emisión. |
| `id_cliente` | `INTEGER` | NO | FK \-\> EXPORTADOR | Exportador dueño del permiso. |

&nbsp;

## 7\. Movimientos y Stock

### Tabla: STOCK\_DEPOSITO

| Columna | Tipo de Dato | Nulo | Restricciones | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| `codigo_vino` | `INTEGER` | NO | PK, FK \-\> VINO | Identifica al vino almacenado. |
| `cantidad` | `INTEGER` | NO | CHECK (\>= 0\) DEFAULT 0 | Botellas totales en el centro logístico. |

&nbsp;

### Tabla: STOCK\_SALA

| Columna | Tipo de Dato | Nulo | Restricciones | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| `id_sala` | `INTEGER` | NO | PK, FK \-\> SALA\_VENTA | Sucursal de venta al público. |
| `codigo_vino` | `INTEGER` | NO | PK, FK \-\> VINO | Identifica al vino almacenado. |
| `cantidad` | `INTEGER` | NO | CHECK (\>= 0\) DEFAULT 0 | Inventario de la sucursal. |

&nbsp;

### Tabla: COMPROBANTE (Ventas)

| Columna | Tipo de Dato | Nulo | Restricciones | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| `nro_comprob.` | `SERIAL` | NO | PK | Autonumérico de facturación. |
| `fecha` | `TIMESTAMP` | NO | DEFAULT CURRENT\_TIMESTAMP | Fecha y hora de venta. |
| `subtotal` | `NUMERIC(12,2)` | NO | DEFAULT 0 | Sumatoria sin descuentos. |
| `descuento` | `NUMERIC(12,2)` | NO | DEFAULT 0 | Monto descontado. |
| `total` | `NUMERIC(12,2)` | NO | DEFAULT 0 | Importe final a pagar. |
| `id_cliente` | `INTEGER` | NO | FK \-\> CLIENTE | Comprador. |
| `id_sala` | `INTEGER` | NO | FK \-\> SALA\_VENTA | Sucursal que facturó. |

&nbsp;

### Tabla: RENGLON\_COMPROBANTE

| Columna | Tipo de Dato | Nulo | Restricciones | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| `nro_comprob.` | `INTEGER` | NO | PK, FK \-\> COMPROBANTE |  |
| `codigo_vino` | `INTEGER` | NO | PK, FK \-\> VINO | Producto vendido. |
| `cantidad` | `INTEGER` | NO | CHECK (\> 0\) | Unidades llevadas. |
| `precio_unitario` | `NUMERIC(10,2)` | NO | CHECK (\> 0\) | Precio congelado al momento de la venta. |
| `descuento` | `NUMERIC(10,2)` | NO | CHECK (\>= 0\) | Descuento aplicado a este producto. |
| `subtotal` | `NUMERIC(12,2)` | NO | CHECK (\> 0\) | (precio\_unitario \* cant) \- descuento. |

&nbsp;

### Tablas: INGRESO y TRANSFERENCIA

*(Comparten estructura base y comportamiento)*

| Columna | Tipo de Dato | Nulo | Restricciones | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| `id_documento` | `SERIAL` | NO | PK | Número de Ingreso o Transferencia. |
| `fecha` | `DATE` | NO | DEFAULT CURRENT\_DATE | Momento de confección. |
| `estado` | `estado_doc` | NO | DEFAULT 'en\_confeccion' | Transición manejada por triggers/SP. |
| `fk_origen_dest` | `INTEGER` | NO | FK \-\> BODEGA/SALA | Dependiendo del tipo de doc. |

&nbsp;

### Tablas: RENGLON\_INGRESO / RENGLON\_TRANSFERENCIA

| Columna | Tipo de Dato | Nulo | Restricciones | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| `id_documento` | `INTEGER` | NO | PK, FK \-\> Cabecera | Cabecera del documento. |
| `codigo_vino` | `INTEGER` | NO | PK, FK \-\> VINO | Producto transportado. |
| `cantidad` | `INTEGER` | NO | CHECK (\> 0\) | Unidades a mover (botellas). |

&nbsp;

### Tabla: AUDITORIA\_PRECIO

| Columna | Tipo de Dato | Nulo | Restricciones | Descripción |
| :---- | :---- | :---- | :---- | :---- |
| `id_auditoria` | `SERIAL` | NO | PK | ID de registro. |
| `precio_anterior` | `NUMERIC(10,2)` | NO |  | Valor antes del UPDATE. |
| `precio_nuevo` | `NUMERIC(10,2)` | NO |  | Valor establecido tras el UPDATE. |
| `fecha_hora` | `TIMESTAMP` | NO | DEFAULT CURRENT\_TIMESTAMP | Momento exacto del cambio. |
| `usuario` | `VARCHAR(50)` | NO | DEFAULT CURRENT\_USER | Usuario de BD que ejecutó el cambio. |
| `codigo_vino` | `INTEGER` | NO | FK \-\> VINO | Vino afectado. |

&nbsp;