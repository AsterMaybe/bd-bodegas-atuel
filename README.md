# Bodegas del Atuel — Sistema de Gestión de Producción y Distribución de Vino

Sistema integral para la gestión de producción de uva y vino, distribución y venta a través de una red de salas de venta distribuidas en distintas localidades. Está compuesto por tres servicios orquestados con Docker: base de datos PostgreSQL, API REST (FastAPI) y frontend (React + Nginx).

---

## 📋 Tabla de contenidos

- [Vista general del proyecto](#vista-general-del-proyecto)
- [Arquitectura](#arquitectura)
- [Requisitos previos](#requisitos-previos)
- [Configuración de variables de entorno](#configuración-de-variables-de-entorno)
- [Inicio rápido](#inicio-rápido)
- [Conexión a la base de datos](#conexión-a-la-base-de-datos)
- [Operaciones de base de datos](#operaciones-de-base-de-datos)
  - [Levantar el entorno de base de datos](#levantar-el-entorno-de-base-de-datos)
  - [Vaciar / restablecer la base de datos](#vaciar--restablecer-la-base-de-datos)
  - [Llenar / sembrar la base de datos](#llenar--sembrar-la-base-de-datos)
  - [Reconstruir todo el entorno](#reconstruir-todo-el-entorno)
- [Ejecutar la aplicación](#ejecutar-la-aplicación)
- [Endpoints de la API](#endpoints-de-la-api)
- [Credenciales por defecto](#credenciales-por-defecto)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Puertos expuestos](#puertos-expuestos)
- [Comandos útiles de psql](#comandos-útiles-de-psql)
- [Licencia](#licencia)

---

## Vista general del proyecto

**Bodegas del Atuel** es un sistema de gestión de bodegas que cubre todo el ciclo productivo y comercial del vino: cosecha de uva, análisis de calidad, elaboración de vinos, stock en depósito y salas de venta, transferencias entre salas, ventas a clientes (socios, distribuidores, exportadores), ingresos de mercadería, permisos de exportación y auditoría de precios.

### Propósito principal

Ofrecer una base de datos relacional robusta (PostgreSQL), una API REST para operar sobre los datos y una interfaz web para consultar y gestionar la operación diaria de las bodegas y su red de salas de venta.

---

## Arquitectura

El proyecto despliega tres contenedores conectados mediante una red Docker puente (`bodegas-network`):

```
+----------------+      +-----------------+      +-----------------+
|   front        |      |     api         |      |      db         |
|  React + Nginx |<---> |  FastAPI (Py)   |<---> | PostgreSQL 14   |
|  :3000         |      |  :8000          |      |  :5432          |
+----------------+      +-----------------+      +-----------------+
```

- **`db`** (`bodegas_db`): PostgreSQL 14 con Python, `uv`, `psycopg[binary]`, `faker`, `python-dotenv` y `bcrypt` para permitir la carga masiva de datos (`seed.py`) dentro del contenedor. Las migraciones en `db/migrations/` se ejecutan al inicializar el volumen.
- **`api`** (`bodegas_api`): FastAPI (Python 3.12) con psycopg3, sin ORM. Expone endpoints REST y documenta automáticamente con Swagger UI.
- **`front`** (`bodegas_front`): React 18 + Vite servido mediante Nginx. Proxyea las llamadas a `/api/`, `/auth/`, `/salud`, `/health`, `/docs` y `/redoc` hacia la API.

Los datos de PostgreSQL persisten en el volumen con nombre `postgres_data`.

---

## Requisitos previos

Antes de comenzar, asegúrese de tener instalado:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) o Docker Engine
- [Docker Compose](https://docs.docker.com/compose/) (v2+ recomendado, se usa `docker compose`)

Opcional, solo para desarrollo local fuera de Docker:

- Python 3.12+ (API)
- Node.js 20+ (frontend)

---

## Configuración de variables de entorno

El proyecto usa un archivo `.env` en la raíz. Si no existe, los scripts de arranque lo crean automáticamente a partir de `.env.example`.

Copie el ejemplo y ajuste los valores si es necesario:

```bash
copy .env.example .env
```

Contenido de `.env.example`:

```ini
# PostgreSQL Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=bodegas_atuel

# API Configuration
ENV=production
LOG_LEVEL=info
PORT=8000
```

Para el script de siembra (`seed.py`), existe opcionalmente `db/seed/.env.seed` con variables como `SEED`, `N_EMP`, `N_CLIENTE`, `N_COMP`, `CAMPAIGNS`, etc. Consulte `db/seed/README.md` si lo conserva.

> **Nota:** el archivo `.env` no se versiona (está en `.gitignore`).

---

## Inicio rápido

Desde la raíz del proyecto, levante todos los servicios en segundo plano:

```bash
docker compose up -d
```

Espere a que los contenedores estén saludables y acceda a:

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| API (Swagger UI) | http://localhost:8000/docs |
| API (health) | http://localhost:8000/health |
| Base de datos (psql) | localhost:5432 |

En Windows también puede usar los scripts de `db-scripts/windows/`:

```powershell
.\db-scripts\windows\up-all.ps1
```

---

## Conexión a la base de datos

Para acceder de forma interactiva a PostgreSQL desde la terminal:

```bash
docker exec -it bodegas_db psql -U postgres -d bodegas_atuel
```

Credenciales usadas por defecto (ver `.env.example`):

- Usuario: `postgres`
- Contraseña: `password`
- Base de datos: `bodegas_atuel`

Una vez dentro de `psql`, puede listar tablas con `\dt`, salir con `\q` o ejecutar consultas SQL directamente.

---

## Operaciones de base de datos

### Levantar el entorno de base de datos

Arranque solo el servicio de base de datos (útil si ya tiene la API y el frontend por otro lado):

```bash
docker compose up -d db
```

O todos los servicios:

```bash
docker compose up -d
```

### Vaciar / restablecer la base de datos

El script `db/empty_database.sql` trunca todas las tablas **excepto** `USUARIO` (conserva los usuarios funcionales) y reinicia las secuencias.

**Windows (CMD):**

```cmd
type db\empty_database.sql | docker exec -i bodegas_db psql -U postgres -d bodegas_atuel
```

**Windows (PowerShell):**

```powershell
.\db-scripts\windows\empty-db.ps1
# Omitir confirmación:
.\db-scripts\windows\empty-db.ps1 -Yes
```

> ⚠️ Esta operación borra todos los datos de las tablas (excepto usuarios). No se puede deshacer.

### Llenar / sembrar la base de datos

El script `db/seed/seed.py` carga datos deterministas (semilla `SEED=42`) dentro del contenedor de base de datos:

```bash
docker exec bodegas_db python3 /opt/seed/seed.py
```

**Windows (PowerShell):**

```powershell
.\db-scripts\windows\seed-db.ps1
```

Usuarios creados automáticamente por el siembrador (ver [Credenciales por defecto](#credenciales-por-defecto)).

### Reconstruir todo el entorno

Para partir de cero (borra volúmenes y reconstruye imágenes sin caché):

```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

Luego siembre los datos:

```bash
docker exec bodegas_db python3 /opt/seed/seed.py
```

En Windows (PowerShell):

```powershell
.\db-scripts\windows\down-all.ps1
.\db-scripts\windows\rebuild-all.ps1
.\db-scripts\windows\up-all.ps1
.\db-scripts\windows\seed-db.ps1
```

---

## Ejecutar la aplicación

### Paso 1: Preparar el entorno

```bash
copy .env.example .env
```

### Paso 2: Levantar todos los servicios

```bash
docker compose up -d
```

### Paso 3: Verificar estado de los contenedores

```bash
docker compose ps
```

Todos deben mostrar `healthy`.

### Paso 4: Sembrar datos (opcional pero recomendado)

```bash
docker exec bodegas_db python3 /opt/seed/seed.py
```

### Paso 5: Acceder a la aplicación

- Frontend: http://localhost:3000
- Documentación de la API: http://localhost:8000/docs

Para detener los servicios sin borrar los datos:

```bash
docker compose down
```

Para detener y borrar también los volúmenes de datos:

```bash
docker compose down -v
```

---

## Endpoints de la API

La API expone los siguientes grupos de endpoints (base: `http://localhost:8000`):

| Grupo | Endpoints principales | Descripción |
|-------|----------------------|-------------|
| Salud | `GET /health`, `GET /salud` | Verificación de conexión a la BD |
| Autenticación | `POST /auth/login`, `GET /auth/me` | Login y sesión de usuario |
| Catálogo | `GET/POST/PUT/DELETE /api/catalogo/{departamentos,localidades,cepas,maridajes}` | Datos maestros |
| Vinos | `GET/POST/PUT/DELETE /api/vinos`, `GET /api/vinos/{id}` | Catálogo de vinos con composición y maridajes |
| Bodegas | `GET/POST/PUT/DELETE /api/bodegas`, `GET /api/bodegas/{id}` | Bodegas elaboradoras |
| Salas | `GET/POST/PUT/DELETE /api/salas`, `GET /api/salas/{id}` | Salas de venta |
| Fincas | `GET/POST/PUT/DELETE /api/fincas/fincas`, `GET /api/fincas/fincas/{id}` | Fincas y parcelas |
| Clientes | `GET/POST/PUT/DELETE /api/clientes`, `GET /api/clientes/{id}` | Socios, distribuidores, exportadores |
| Transportistas | `GET/POST/PUT/DELETE /api/transportistas`, `GET /api/transportistas/{id}/localidades` | Transportistas y coberturas |
| Ingresos | `POST /api/ingresos`, `POST /api/ingresos/{cod}/renglones`, `POST /api/ingresos/{cod}/procesar`, `GET /api/ingresos/{cod}` | Ingresos de mercadería |
| Transferencias | `POST /api/transferencias`, `POST /api/transferencias/{nro}/renglones`, `POST /api/transferencias/{nro}/terminar`, `POST /api/transferencias/{nro}/procesar`, `GET /api/transferencias/{nro}` | Transferencias entre salas |
| Comprobantes | `POST /api/comprobantes`, `GET /api/comprobantes/{nro}` | Ventas y comprobantes |
| Reportes | `GET /api/reportes/top-vinos`, `GET /api/reportes/ventas-por-sala`, `GET /api/reportes/vinos-sin-stock`, `GET /api/reportes/transportista-activo`, `GET /api/reportes/trazabilidad/{cod}`, `GET /api/reportes/dashboard-stats` | Consultas analíticas (S1–S12) |
| Actividad | `GET /api/activity`, `GET /api/activity/{id}` | Registro de operaciones |

La documentación interactiva completa está en http://localhost:8000/docs (Swagger UI).

---

## Credenciales por defecto

El siembrador crea dos usuarios del sistema en la tabla `USUARIO`:

| Usuario | Email | Contraseña | Rol |
|---------|-------|------------|-----|
| Administrador | admin@bodegasatuel.com | admin123 | administrador |
| Empleado | empleado@bodegasatuel.com | empleado123 | empleado |

Estas credenciales se usan para autenticarse en `POST /auth/login` y acceder a las rutas protegidas del frontend.

---

## Estructura del proyecto

```
proyecto-db1/
├── docker-compose.yaml          # Orquestación de los 3 servicios
├── Dockerfile                   # Imagen PostgreSQL 14 con Python para seed
├── .env.example                 # Plantilla de variables de entorno
├── README.md                    # Este archivo
├── LICENSE
├── db/
│   ├── migrations/              # 001_esquema.sql ... 010_usuarios.sql (initdb)
│   ├── empty_database.sql       # Vaciar tablas (excepto USUARIO)
│   ├── seed/
│   │   ├── seed.py              # Carga masiva determinista de datos
│   │   ├── catalogo/            # CSV de departamentos, localidades, cepas, maridajes
│   │   └── dump_completo.sql.gz # Volcado de base de datos
│   └── tests/                   # Pruebas de integridad (RN-01 a RN-15) y concurrencia
├── api/
│   ├── src/                     # Código FastAPI (config, db, queries, schemas, routes, errors)
│   ├── requirements.txt
│   └── Dockerfile
├── front/
│   ├── src/                     # React + Vite (pages, api, hooks, components)
│   ├── nginx.conf               # Proxy y SPA
│   ├── package.json
│   └── Dockerfile
├── consultas/                   # Consultas SQL: select, insert, update, delete
│   └── PARAMETROS.md            # Mapeo de parámetros de consultas
├── db-scripts/
│   └── windows/                 # Scripts PowerShell y CMD: up-all, down-all, rebuild-all, seed-db, empty-db
└── docs/                        # Documentación del proyecto (DER, informe, diccionario de datos)
```

---

## Puertos expuestos

| Contenedor | Puerto host | Puerto contenedor | Servicio |
|------------|-------------|-------------------|----------|
| `bodegas_db` | 5432 | 5432 | PostgreSQL |
| `bodegas_api` | 8000 | 8000 | FastAPI |
| `bodegas_front` | 3000 | 80 | React + Nginx |

---

## Comandos útiles de psql

Acceso interactivo:

```bash
docker exec -it bodegas_db psql -U postgres -d bodegas_atuel
```

Ejecutar un archivo SQL dentro del contenedor:

```bash
docker exec -i bodegas_db psql -U postgres -d bodegas_atuel -f archivo.sql
```

Ejecutar una consulta rápida:

```bash
docker exec bodegas_db psql -U postgres -d bodegas_atuel -c "SELECT COUNT(*) FROM USUARIO;"
```

Listar tablas:

```bash
docker exec -it bodegas_db psql -U postgres -d bodegas_atuel -c "\dt"
```

Volcar la base de datos:

```bash
docker exec bodegas_db pg_dump -U postgres -d bodegas_atuel --no-owner --no-privileges > respaldo.sql
```

---

## Licencia

Este proyecto está bajo la licencia [MIT](LICENSE).
