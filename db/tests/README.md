# TESTS — Pruebas de integridad y concurrencia

Este documento describe cómo ejecutar las pruebas del TPI "Bodegas del Atuel", incluyendo las pruebas de integridad de reglas de negocio (RN-01 a RN-15) y la demostración de concurrencia (Etapa 2, Paso 8).

---

## 1. Pruebas de integridad (`db_tests.sql`)

Archivo: `db/tests/db_tests.sql`

Ejecuta todas las pruebas de reglas de negocio RN-01 a RN-15.

```powershell
docker exec -i bodegas_db psql -U postgres -d bodegas_atuel -f /tmp/db_tests.sql
```

Nota: los errores esperados (check violations, foreign key violations, RN-09 stock insuficiente, etc.) son parte del diseño de las pruebas y validan que las restricciones funcionen correctamente.

---

## 2. Demostración de concurrencia (Etapa 2, Paso 8)

La demostración compara dos escenarios de venta concurrente sobre la última botella de un vino en una sala de venta, usando dos sesiones independientes de `psql` (Sesión A y Sesión B).

### Archivos SQL

- `db/setup_concurrencia.sql` — prepara el estado inicial (stock = 1 botella en sala 901, vino 9001, cliente 9001 y catálogos mínimos).
- `db/concurrencia_sesion_A_no_lock.sql` — Sesión A, sin `FOR UPDATE`.
- `db/concurrencia_sesion_B_no_lock.sql` — Sesión B, sin `FOR UPDATE`.
- `db/concurrencia_sesion_A_for_update.sql` — Sesión A, con `SELECT ... FOR UPDATE`.
- `db/concurrencia_sesion_B_for_update.sql` — Sesión B, con `SELECT ... FOR UPDATE`.

### 2.1 Comandos necesarios para correr el test de concurrencia

#### Paso 1: Copiar los archivos al contenedor
```powershell
docker cp db/setup_concurrencia.sql bodegas_db:/tmp/setup_concurrencia.sql
docker cp db/concurrencia_sesion_A_no_lock.sql bodegas_db:/tmp/concurrencia_sesion_A_no_lock.sql
docker cp db/concurrencia_sesion_B_no_lock.sql bodegas_db:/tmp/concurrencia_sesion_B_no_lock.sql
docker cp db/concurrencia_sesion_A_for_update.sql bodegas_db:/tmp/concurrencia_sesion_A_for_update.sql
docker cp db/concurrencia_sesion_B_for_update.sql bodegas_db:/tmp/concurrencia_sesion_B_for_update.sql
```

#### Paso 2: Ejecutar el setup (configura stock = 1)
```powershell
docker exec -i bodegas_db psql -U postgres -d bodegas_atuel -f /tmp/setup_concurrencia.sql
```
Resultado esperado: `stock_inicial = 1`.

#### Paso 3: Resetear el stock a 1 antes de cada escenario
```powershell
docker exec -i bodegas_db psql -U postgres -d bodegas_atuel -c "UPDATE stock_sala SET cantidad = 1 WHERE id_sala = 901 AND codigo_vino = 9001;"
```

---

### 2.2 Escenario 1: Con bloqueo explícito (`SELECT ... FOR UPDATE`)

Abrí **dos terminales de PowerShell/CMD** lado a lado.

**Terminal A (Sesión A):**
```powershell
docker exec -i bodegas_db psql -U postgres -d bodegas_atuel -f /tmp/concurrencia_sesion_A_for_update.sql
```

**Terminal B (Sesión B):** ejecutar mientras la Terminal A está en `pg_sleep(5)`.
```powershell
docker exec -i bodegas_db psql -U postgres -d bodegas_atuel -f /tmp/concurrencia_sesion_B_for_update.sql
```

#### Resultado observado

```
=== SESIÓN A (con FOR UPDATE): Iniciando transacción ===
BEGIN
--- Sesión A: SELECT ... FOR UPDATE (adquiere bloqueo de fila) ---
 cantidad
----------
        1
(1 row)

--- Sesión A: Espera 3 segundos (mantiene el bloqueo) ---
 pg_sleep
----------

(1 row)

--- Sesión A: Stock leído. Ahora actualiza a 0 (vende la última botella) ---
UPDATE 1
--- Sesión A: Registra la venta ---
INSERT 0 1
--- Sesión A: COMMIT (libera el bloqueo de fila) ---
psql:/tmp/concurrencia_sesion_A_for_update.sql:30: ERROR:  Stock insuficiente del vino 9001 en la sala 901 (stock disponible: 0, solicitado: 1) (RN-09)
CONTEXT:  PL/pgSQL function fn_trg_validar_y_preparar_renglon_venta() line 29 at RAISE
ROLLBACK
=== SESIÓN A (con FOR UPDATE): Transacción finalizada ===


=== SESIÓN B (con FOR UPDATE): Iniciando transacción ===
BEGIN
--- Sesión B: SELECT ... FOR UPDATE (quedará BLOQUEADA hasta que A haga COMMIT) ---
 cantidad
----------
        1
(1 row)

--- Sesión B: Desbloqueada. Lee stock tras COMMIT de A ---
--- Sesión B: Intenta vender la misma botella (UPDATE a -1) ---
psql:/tmp/concurrencia_sesion_B_for_update.sql:22: ERROR:  new row for relation "stock_sala" violates check constraint "chk_stock_sala_no_negativo"
DETAIL:  Failing row contains (901, 9001, -1).
--- Sesión B: El UPDATE debe fallar por CHECK (cantidad >= 0) ---
--- Sesión B: ROLLBACK ---
ROLLBACK
=== SESIÓN B (con FOR UPDATE): Transacción finalizada ===
```

**Análisis:** La Sesión B quedó bloqueada en `SELECT ... FOR UPDATE` hasta que la Sesión A terminó su transacción. Al desbloquearse, leyó el stock actualizado e intentó vender a -1, fallando por la restricción `CHECK (cantidad >= 0)`. El bloqueo serializó el acceso y evitó la condición de carrera.

---

### 2.3 Escenario 2: Sin bloqueo (ausencia de `FOR UPDATE`)

Primero resetear el stock a 1 (Paso 3 arriba).

**Terminal A (Sesión A):**
```powershell
docker exec -i bodegas_db psql -U postgres -d bodegas_atuel -f /tmp/concurrencia_sesion_A_no_lock.sql
```

**Terminal B (Sesión B):** ejecutar inmediatamente después, mientras la Terminal A está en `pg_sleep(3)`.
```powershell
docker exec -i bodegas_db psql -U postgres -d bodegas_atuel -f /tmp/concurrencia_sesion_B_no_lock.sql
```

#### Resultado observado

```
=== SESIÓN A (sin FOR UPDATE): Iniciando transacción ===
BEGIN
--- Sesión A: SELECT simple (sin FOR UPDATE, sin bloqueo) ---
 cantidad
----------
        1
(1 row)

--- Sesión A: Espera 3 segundos para que la Sesión B también lea el stock ---
 pg_sleep
----------

(1 row)

--- Sesión A: Stock leído = 1. Ahora actualiza a 0 (vende la última botella) ---
UPDATE 1
--- Sesión A: Registra la venta ---
INSERT 0 1
psql:/tmp/concurrencia_sesion_A_no_lock.sql:29: ERROR:  Stock insuficiente del vino 9001 en la sala 901 (stock disponible: 0, solicitado: 1) (RN-09)
CONTEXT:  PL/pgSQL function fn_trg_validar_y_preparar_renglon_venta() line 29 at RAISE
--- Sesión A: COMMIT ---
ROLLBACK
=== SESIÓN A (sin FOR UPDATE): Transacción finalizada ===


BEGIN
--- Sesión B: SELECT simple (sin FOR UPDATE, lee stock = 1 también) ---
 cantidad
----------
        1
(1 row)

--- Sesión B: Intenta vender la misma botella (UPDATE a -1) ---
--- Sesión B: El UPDATE debe fallar por CHECK (cantidad >= 0) ---
--- Sesión B: ROLLBACK ---
psql:/tmp/concurrencia_sesion_B_no_lock.sql:19: ERROR:  new row for relation "stock_sala" violates check constraint "chk_stock_sala_no_negativo"
DETAIL:  Failing row contains (901, 9001, -1).
ROLLBACK
=== SESIÓN B (sin FOR UPDATE): Transacción finalizada ===
```

**Análisis:** Ambas sesiones leyeron `cantidad = 1` simultáneamente (condición de carrera). La Sesión B intentó descontar a -1 y falló por `chk_stock_sala_no_negativo`. La Sesión A falló al confirmar por el trigger `RN-09` (stock insuficiente). Sin el bloqueo explícito, ambas operaron sobre el mismo stock inicial.

---

### 2.4 Verificación del estado final

Después de cualquiera de los dos escenarios, el stock debe quedar en `1` (ambas transacciones hicieron `ROLLBACK`):

```powershell
docker exec -i bodegas_db psql -U postgres -d bodegas_atuel -c "SELECT id_sala, codigo_vino, cantidad FROM stock_sala WHERE id_sala = 901 AND codigo_vino = 9001;"
```

Resultado esperado:
```
 id_sala | codigo_vino | cantidad
---------+-------------+----------
     901 |        9001 |        1
```

---

## 3. Resumen de conclusiones

| Aspecto | Sin `FOR UPDATE` | Con `FOR UPDATE` |
|---------|------------------|------------------|
| Lectura de stock | Ambas leen `cantidad = 1` simultáneamente | Sesión B queda bloqueada hasta que A termina |
| Condición de carrera | Sí (ambas leen stock = 1) | No (acceso serializado) |
| Resultado de la segunda venta | Falla por `CHECK (cantidad >= 0)` | Falla por `CHECK (cantidad >= 0)` |
| Integridad del stock | Preservada por `CHECK` + trigger RN-09 | Preservada por bloqueo + `CHECK` + trigger RN-09 |

El nivel de aislamiento por defecto de PostgreSQL (`READ COMMITTED`) permite que ambas sesiones lean el mismo stock inicial si no se aplica un bloqueo explícito a nivel de fila. `SELECT ... FOR UPDATE` previene la anomalía garantizando que solo una transacción modifique el stock a la vez.
