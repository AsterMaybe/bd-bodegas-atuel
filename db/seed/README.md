# SEED - Carga masiva Etapa 3

## Requisitos
- PostgreSQL 14 (contenedor `bodegas_db`).
- Python 3.11+ con `psycopg[binary]` y `faker`.

## Ejecutar seed
```bash
pip install "psycopg[binary]" faker
python db/seed/seed.py
```
O dentro del contenedor:
```bash
docker exec bodegas_db python3 /opt/seed/seed.py
```
Variables de entorno opcionales: PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD.

El script resetea la base, deshabilita triggers de usuario, carga datos deterministicos (SEED=42), rehabilita triggers y ejecuta validaciones.

## Validaciones
```bash
psql -U postgres -d bodegas_atuel -f db/seed/validacion_carga.sql
```

## Dump
```bash
docker exec bodegas_db pg_dump -U postgres -d bodegas_atuel --no-owner --no-privileges | gzip > db/seed/dump_completo.sql.gz
```
Restaurar:
```bash
gunzip -c db/seed/dump_completo.sql.gz | psql -U postgres -d bodegas_atuel
```
