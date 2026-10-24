# API - Bodegas del Atuel

API REST que expone la base de datos PostgreSQL mediante consultas SQL explicitas (sin ORM), siguiendo las reglas de la Etapa 6 del proyecto.

## Estructura de Modulos

### `src/config/settings.py` - carga y valida variables de entorno (puerto, DATABASE_URL, pool, etc.) usando pydantic-settings
- `get_settings()` - Carga y valida variables de entorno (puerto, DATABASE_URL, pool, etc.) usando pydantic-settings.

### `src/db/pool.py` - gestiona el pool de conexiones async (psycopg3) con rol app_rw y helpers de transaccion
- `get_pool()` - Crea/reutiliza el pool de conexiones async (psycopg3) con rol `app_rw`.
- `health_check()` - Ejecuta `SELECT 1` para verificar que la BD responda.
- `close_pool()` - Cierra el pool de conexiones.
- `with_transaction(fn)` - Ejecuta `fn` dentro de BEGIN/COMMIT/ROLLBACK automatico.
- `with_transaction_ro(fn)` - Ejecuta `fn` en transaccion de solo lectura.

### `src/db/queries/` - capa de acceso a datos (una funcion por consulta, SQL parametrizado)

#### `salud.py` - verifica la conexion a la base de datos
- `check_health()` - Verifica conexion a la BD (`SELECT 1`).

#### `vinos.py` - CRUD de vinos con filtros, paginacion, composicion y maridajes
- `list_vinos(tipo, cepa, bodega, aniada, page, limit)` - Lista vinos con filtros y paginacion.
- `get_vino_by_id(codigo_vino)` - Detalle de vino con composicion (cepas + %) y maridajes.
- `create_vino(data)` - Inserta vino + composicion en transaccion (trigger valida suma 100%).
- `update_vino(codigo_vino, data)` - Actualiza vino (trigger audita cambio de precio).
- `delete_vino(codigo_vino)` - Elimina vino (FK RESTRICT si tiene movimientos).

#### `clientes.py` - CRUD de clientes con subtipos (socio, distribuidor, exportador)
- `list_clientes(page, limit)` - Lista clientes con paginacion e identifica subtipo.
- `get_cliente_by_id(id_cliente)` - Detalle con datos de subtipo (socio/distribuidor/exportador) y permisos.
- `create_cliente(data)` - Inserta cliente base + subtipo en transaccion.
- `update_cliente(id_cliente, data)` - Actualiza datos del cliente base.
- `delete_cliente(id_cliente)` - Elimina cliente (FK RESTRICT si tiene comprobantes).

#### `comprobantes.py` - ventas completas (cabecera + renglones) en una sola transaccion
- `create_comprobante(data)` - Venta completa (cabecera + renglones) en una transaccion; triggers calculan precio, descuento, stock y totales.
- `get_comprobante_by_id(nro_comprob)` - Detalle de comprobante con sus renglones.

#### `transferencias.py` - circuito de transferencias (alta, renglones, terminar, procesar)
- `create_transferencia(data)` - Crea transferencia en estado `en_confeccion`.
- `add_renglones_transferencia(id_documento, renglones)` - Agrega renglones (solo si esta en confeccion).
- `terminar_transferencia(id_documento)` - Cambia estado a `terminado` (trigger valida transicion).
- `procesar_transferencia(id_documento)` - Invoca `sp_procesar_transferencia` (valida stock deposito, mueve stock).
- `get_transferencia_by_id(id_documento)` - Detalle con renglones.

#### `ingresos.py` - circuito de ingresos (alta, renglones, procesar)
- `create_ingreso(data)` - Crea ingreso en estado `en_confeccion`.
- `add_renglones_ingreso(id_documento, renglones)` - Agrega renglones (solo si esta en confeccion).
- `procesar_ingreso(id_documento)` - Invoca `sp_procesar_ingreso` (valida estado terminado, mueve stock deposito).
- `get_ingreso_by_id(id_documento)` - Detalle con renglones.

#### `reportes.py` - consultas de reportes (top vinos, ventas por sala, vinos sin stock, etc.)
- `top_vinos(limit)` - S1: Ranking de los 10 vinos mas vendidos por botellas.
- `ventas_por_sala(desde, hasta)` - S8: Monto total de ventas por sala.
- `vinos_sin_stock(id_sala)` - S6: Vinos sin stock en sala pero con stock en deposito.
- `transportista_activo(desde, hasta)` - S7: Transportista con mayor actividad.
- `trazabilidad(codigo_vino)` - S9/S12: Trazabilidad completa de un vino (cepas, bodega, maridajes, stock).

### `src/errors/map.py` - traduce excepciones de BD (SQLSTATE) y validacion (pydantic) a codigos HTTP
- `map_error(exc)` - Traduce excepciones (psycopg, pydantic, genericas) a `ApiError` con codigo HTTP segun SQLSTATE.
- `map_pg_error(exc)` - Traduce errores de PostgreSQL usando la tabla SQLSTATE a HTTP.
- `map_pydantic_error(exc)` - Traduce errores de validacion Pydantic a 400.
- `map_generic_error(exc)` - Error generico 500.

### `src/errors/handler.py` - handler global de excepciones de FastAPI
- `global_exception_handler(request, exc)` - Handler global de FastAPI que usa `map_error` y retorna JSONResponse.

### `src/schemas/` - validacion sintactica de payloads (solo tipos/formatos, sin reglas de negocio)

#### `common.py` - parametros comunes de paginacion y filtros
- `PaginationParams` - Parametros de paginacion (page, limit).
- `PaginatedResponse` - Respuesta paginada generica.
- `VinosFilter` - Filtros de vinos (tipo, cepa, bodega, aniada).
- `DateRangeParams` - Rango de fechas (desde, hasta).

#### `vinos.py` - modelos de entrada y salida para vinos
- `ComposicionItem` - Item de composicion (id_cepa, porcentaje).
- `VinoCreate` - Payload para crear vino (nombre, tipo, aniada, volumen, graduacion, precio, bodega, composicion).
- `VinoUpdate` - Payload para actualizar vino (campos opcionales).
- `VinoResponse` - Respuesta de vino con composicion, maridajes y stock.

#### `clientes.py` - modelos de entrada y salida para clientes
- `ClienteCreate` - Payload para crear cliente (nombre, tipo_doc, nro_doc, direccion, CP, descuento, tipo, campos subtipo).
- `ClienteUpdate` - Payload para actualizar cliente.
- `ClienteResponse` - Respuesta de cliente con datos de subtipo y permisos.

#### `comprobantes.py` - modelos de entrada y salida para comprobantes de venta
- `RenglonComprobanteCreate` - Item de renglon (codigo_vino, cantidad).
- `ComprobanteCreate` - Payload para crear comprobante (id_cliente, id_sala, renglones).
- `RenglonComprobanteResponse` - Respuesta de renglon.
- `ComprobanteResponse` - Respuesta de comprobante con renglones.

#### `transferencias.py` - modelos de entrada y salida para transferencias
- `RenglonTransferenciaCreate` - Item de renglon (codigo_vino, cantidad).
- `TransferenciaCreate` - Payload para crear transferencia (id_sala).
- `RenglonTransferenciaResponse` - Respuesta de renglon.
- `TransferenciaResponse` - Respuesta de transferencia con renglones.

#### `ingresos.py` - modelos de entrada y salida para ingresos
- `RenglonIngresoCreate` - Item de renglon (codigo_vino, cantidad).
- `IngresoCreate` - Payload para crear ingreso (cuit_bodega, codigo_transp).
- `RenglonIngresoResponse` - Respuesta de renglon.
- `IngresoResponse` - Respuesta de ingreso con renglones.

### `src/routes/` - endpoints REST (FastAPI)

#### `salud.py` - endpoints de verificacion de salud
- `GET /salud` - Verifica conexion a la BD.
- `GET /health` - Alias de `/salud`.

#### `vinos.py` - endpoints CRUD de vinos
- `GET /vinos` - Catalogo con filtros (tipo, cepa, bodega, aniada) y paginacion.
- `GET /vinos/{codigo_vino}` - Detalle con composicion y maridajes.
- `POST /vinos` - Alta de vino con composicion.
- `PUT /vinos/{codigo_vino}` - Modificacion (audita precio).
- `DELETE /vinos/{codigo_vino}` - Baja.

#### `clientes.py` - endpoints CRUD de clientes
- `GET /clientes` - Lista con paginacion.
- `GET /clientes/{id_cliente}` - Detalle con subtipo.
- `POST /clientes` - Alta con subtipo.
- `PUT /clientes/{id_cliente}` - Modificacion.
- `DELETE /clientes/{id_cliente}` - Baja.

#### `comprobantes.py` - endpoints de ventas
- `POST /comprobantes` - Venta completa en transaccion.
- `GET /comprobantes/{nro}` - Detalle con renglones.

#### `transferencias.py` - endpoints de transferencias
- `POST /transferencias` - Alta (en_confeccion).
- `POST /transferencias/{nro}/renglones` - Carga de renglones.
- `POST /transferencias/{nro}/terminar` - Cambio a terminado.
- `POST /transferencias/{nro}/procesar` - Procesa (invoca procedimiento).
- `GET /transferencias/{nro}` - Detalle con renglones.

#### `ingresos.py` - endpoints de ingresos
- `POST /ingresos` - Alta (en_confeccion).
- `POST /ingresos/{cod}/renglones` - Carga de renglones.
- `POST /ingresos/{cod}/procesar` - Procesa (invoca procedimiento).
- `GET /ingresos/{cod}` - Detalle con renglones.

#### `reportes.py` - endpoints de reportes (solo lectura)
- `GET /reportes/top-vinos` - S1: Ranking de vinos mas vendidos.
- `GET /reportes/ventas-por-sala` - S8: Ventas por sala.
- `GET /reportes/vinos-sin-stock` - S6: Vinos sin stock en sala.
- `GET /reportes/transportista-activo` - S7: Transportista mas activo.
- `GET /reportes/trazabilidad/{cod}` - S9/S12: Trazabilidad de vino.

### `src/main.py` - crea y configura la app FastAPI (CORS, lifespan, rutas, error handler, OpenAPI)
- `create_app()` - Crea y configura la app FastAPI (CORS, lifespan, rutas, error handler, OpenAPI).
- `app` - Instancia global de la aplicacion.

## Ejecucion

```bash
# Solo en Docker
docker compose up -d

# Tests (requiere BD con datos)
python -m pytest tests/

# Swagger UI
# http://localhost:8000/docs
```