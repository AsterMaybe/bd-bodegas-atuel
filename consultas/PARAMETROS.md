# Referencia de Parámetros - Consultas SQL

Este documento mapea cada consulta en `consultas/*.sql` a sus parámetros, tipos esperados y valores de ejemplo validados contra los datos semilla (`db/seed/catalogo/`).

---

## select.sql

| Query | Parámetro | Tipo | Ejemplo | Origen / Validación |
|-------|-----------|------|---------|---------------------|
| **S1** | `$1: limit` | `integer` | `10` | Límite de resultados (1-50) |
| **S3** | `$1: id_sala` | `integer` | `1` | PK `SALA_VENTA.id_sala` |
| **S4** | `$1: codigo_vino` | `integer` | `1` | PK `VINO.codigo_vino` |
| **S6** | `$1: id_sala` | `integer` | `1` | PK `SALA_VENTA.id_sala` |
| **S8** | `$1: fecha_desde` | `date` | `CURRENT_DATE - INTERVAL '3 months'` | Filtro temporal |
| **S8** | `$2: fecha_hasta` | `date` | `CURRENT_DATE` | Filtro temporal |
| **S9** | `$1: codigo_vino` | `integer` | `1` | PK `VINO.codigo_vino` |
| **S12** | `$1: cuit_bodega` | `cuit_dom` | `'20123456789'` | FK `VINO.cuit_bodega` → `BODEGA.cuit` (ver seed: aparece como `cuit_encargado` en todas las localidades) |

---

## insert.sql

| Query | Parámetro | Tipo | Ejemplo | Origen / Validación |
|-------|-----------|------|---------|---------------------|
| **I1** | `$1: codigo_postal` | `localidad_dom` | `5620` | PK `LOCALIDAD.codigo_postal` → **General Alvear** (seed: línea 15) |
| **I2** | `$1: nombre_maridaje` | `text` | `'cordero al disco'` | Valor libre (nuevo registro) |
| **I2** | `$2: temp_servicio` | `numeric` | `18.00` | Grados Celsius sugeridos |
| **I2** | `$3: tipo_vino` | `text` | `'tinto'` | Dominio `tipo_vino_dom` (`tinto`, `blanco`, `rosado`) |
| **I2** | `$4: graduacion_minima` | `numeric` | `14` | Grados alcohol |
| **I3** | `$1: id_cliente` | `integer` | `1` | PK `CLIENTE.id_cliente` |
| **I3** | `$2: id_sala` | `integer` | `1` | PK `SALA_VENTA.id_sala` |
| **I3** | `$3: codigo_vino_1` | `integer` | `306` | PK `VINO.codigo_vino` |
| **I3** | `$4: cantidad_1` | `integer` | `2` | Botellas |
| **I3** | `$5: codigo_vino_2` | `integer` | `86` | PK `VINO.codigo_vino` |
| **I3** | `$6: cantidad_2` | `integer` | `1` | Botellas |
| **I3** | `$7: codigo_vino_3` | `integer` | `363` | PK `VINO.codigo_vino` |
| **I3** | `$8: cantidad_3` | `integer` | `3` | Botellas |
| **I4** | `$1: cuit` | `cuit_dom` | `'30112223334'` | 11 dígitos, PK `BODEGA.cuit` |
| **I4** | `$2: razon_social` | `text` | `'Bodega Nueva Recontra Real Creanme S.A.'` | Nombre legal |
| **I4** | `$3: domicilio` | `text` | `'Ruta 143 Km 20, San Rafael'` | Dirección |
| **I5** | `$1: numero` | `integer` | `1500` | Número de calle (>0) |
| **I5** | `$2: calle` | `text` | `'Av. Hipólito Yrigoyen'` | Nombre de calle |
| **I5** | `$3: dia_de_cierre` | `integer` | `7` | 1=Lun ... 7=Dom (CHECK 1-7) |
| **I5** | `$4: codigo_postal` | `localidad_dom` | `'5600'` | PK `LOCALIDAD.codigo_postal` → **San Rafael** (seed: línea 14) |
| **I6** | `$1: codigo_vino` | `integer` | `10` | PK `VINO.codigo_vino` |
| **I6** | `$2: cuit_bodega` | `cuit_dom` | `'30000000001'` | FK `INGRESO.cuit_bodega` → `BODEGA.cuit` |
| **I6** | `$3: codigo_transp` | `integer` | `5` | PK `TRANSPORTISTA.codigo` |
| **I6** | `$4: cantidad` | `integer` | `120` | Botellas a ingresar |

---

## update.sql

| Query | Parámetro | Tipo | Ejemplo | Origen / Validación |
|-------|-----------|------|---------|---------------------|
| **U3** | `$1: cuit_bodega` | `cuit_dom` | `'20123456789'` | FK `VINO.cuit_bodega` → `BODEGA.cuit` (ver seed: `cuit_encargado` en todas las localidades) |

> **Nota**: U1, U2, U4, U5, U6 no requieren parámetros externos (usan lógica de negocio / funciones internas).

---

## delete.sql

| Query | Parámetro | Tipo | Ejemplo | Origen / Validación |
|-------|-----------|------|---------|---------------------|
| **D3** | `$1: codigo_postal` | `localidad_dom` | `5620` | PK `LOCALIDAD.codigo_postal` → **General Alvear** (seed: línea 15) |
| **D6** | `$1: codigo_postal` | `localidad_dom` | `5600` | PK `LOCALIDAD.codigo_postal` → **San Rafael** (seed: línea 14) |

> **Nota**: D1, D2, D4, D5 no requieren parámetros externos (usan lógica de negocio / funciones internas).

---

## Validación contra Datos Semilla

### Localidades (`db/seed/catalogo/localidades.csv`)
| codigo_postal | nombre | cuit_encargado |
|---------------|--------|----------------|
| 5500 | Capital | 20123456789 |
| 5501 | Godoy Cruz | 20123456789 |
| 5519 | Guaymallén | 20123456789 |
| 5539 | Las Heras | 20123456789 |
| 5507 | Luján de Cuyo | 20123456789 |
| 5515 | Maipú | 20123456789 |
| 5570 | San Martín | 20123456789 |
| 5584 | Junín | 20123456789 |
| 5577 | Rivadavia | 20123456789 |
| 5590 | Tunuyán | 20123456789 |
| 5561 | Tupungato | 20123456789 |
| 5567 | San Carlos | 20123456789 |
| **5600** | **San Rafael** | 20123456789 |
| **5620** | **General Alvear** | 20123456789 |
| 5613 | Malargüe | 20123456789 |
| 5533 | Lavalle | 20123456789 |
| 5559 | Santa Rosa | 20123456789 |
| 5591 | La Paz | 20123456789 |

### Departamentos (`db/seed/catalogo/departamento.csv`)
- Todos los nombres de localidad en `localidades.csv` tienen departamento correspondiente en `departamento.csv`.

### Cepas (`db/seed/catalogo/cepa.csv`)
- 12 variedades: Malbec, Cabernet Sauvignon, Merlot, Syrah, Bonarda, Tempranillo, Pinot Noir, Chardonnay, Sauvignon Blanc, Torrontés, Chenin Blanc, Semillón.

### Observaciones importantes
1. **CUIT `'20123456789'`** aparece como `cuit_encargado` para **todas** las localidades en el seed. No es una bodega real, es un valor de prueba/placeholder.
2. Los códigos postales **5620 (General Alvear)** y **5600 (San Rafael)** existen y son válidos como PK.
3. Los parámetros `codigo_postal` reemplazan los filtros por `nombre` (frágil a tildes/mayúsculas) por la **clave primaria** robusta.

---

## Convención de Notación

| Notación | Uso |
|----------|-----|
| `$1, $2, ...` | Parámetros posicionales estilo PostgreSQL (nativo `libpq`) |
| `%s` | Placeholder estilo `psycopg2` (Python) - equivalente a `$1` en orden |

Ambas son válidas; los archivos `.sql` usan `$n` para claridad posicional. La capa API (Python/psycopg) usa `%s` internamente.

---

## Uso Recomendado

```bash
# Ejemplo psql (nativo)
psql -d vino_db -f consultas/select.sql -v limit=10 -v id_sala=1 -v codigo_vino=306

# Ejemplo Python (psycopg)
cur.execute(sql, (10, 1, 306))  # Orden: $1, $2, $3
```

Los parámetros se pasan en el orden en que aparecen en la consulta (`$1`, `$2`, `$3`...).