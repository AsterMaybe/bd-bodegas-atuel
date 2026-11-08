# Proyecto DB - Docker Scripts

Scripts para gestionar el entorno Docker de Bodegas del Atuel desde fuera del proyecto.

## Ubicación
```
C:\Users\Aster\Desktop\Proyecto-db-scripts\
```

## Scripts Disponibles

### Windows (.bat)
| Script | Descripción |
|--------|-------------|
| `rebuild-all.bat` | Reconstruye todas las imágenes Docker sin caché |
| `up-all.bat` | Inicia todos los servicios (db, api, front) |
| `down-all.bat` | Detiene todos los servicios (mantiene volúmenes) |
| `empty-db.bat` | Vacía la base de datos (trunca todas las tablas). Usa `--yes` para saltar confirmación |
| `seed-db.bat` | Ejecuta el seed de datos (carga masiva) |

### Linux/WSL (.sh)
| Script | Descripción |
|--------|-------------|
| `rebuild-all.sh` | Reconstruye todas las imágenes Docker sin caché |
| `up-all.sh` | Inicia todos los servicios |
| `down-all.sh` | Detiene todos los servicios |
| `empty-db.sh` | Vacía la base de datos. Usa `--yes` para saltar confirmación |
| `seed-db.sh` | Ejecuta el seed de datos |

## Uso Rápido

```cmd
# Reconstruir todo desde cero
.\rebuild-all.bat

# Levantar servicios
.\up-all.bat

# Ver logs
docker-compose logs -f

# Bajar servicios
.\down-all.bat

# Vaciar BD y recargar seed (automático sin confirmación)
.\empty-db.bat --yes
.\seed-db.bat
```

## Personalizar el Seed

El seed se define en:
- **Script principal**: `C:\Users\Aster\Desktop\Proyecto-db\db\seed\seed.py`
- **Catálogos CSV**: `C:\Users\Aster\Desktop\Proyecto-db\db\seed\catalogo\`

### Parámetros principales en `seed.py`:
```python
SEED = 42                    # Semilla aleatoria
N_EMP = 60                   # Empleados
N_SALA = 30                  # Salas de venta
N_BODEGA = 20                # Bodegas
N_TRANSP = 15                # Transportistas
N_FINCA = 40                 # Fincas
N_PARCELA_TARGET = 600       # Parcelas
N_VINO = 400                 # Vinos
N_CLIENTE = 20000            # Clientes
N_INGRESO = 2500             # Ingresos
N_TRANSF = 2500              # Transferencias
N_COMP = 150000              # Comprobantes
CAMPAIGNS = [2022,2023,2024,2025,2026]
```

### Usuarios creados por defecto:
| Email | Password | Rol |
|-------|----------|-----|
| admin@bodegasatuel.com | admin123 | administrador |
| empleado@bodegasatuel.com | empleado123 | empleado |

## Flujo Completo de Reinicio Limpio

```cmd
# 1. Bajar todo y borrar volúmenes
docker-compose down -v

# 2. Reconstruir imágenes
.\rebuild-all.bat

# 3. Levantar (crea BD fresca + migraciones)
.\up-all.bat

# 4. Cargar datos seed
.\seed-db.bat

# O solo vaciar y recargar datos (mantiene contenedores)
.\empty-db.bat --yes
.\seed-db.bat
```

## URLs de Acceso
- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **API Health**: http://localhost:8000/health

## Comando para acceder a db en docker
docker exec -it bodegas_db psql -U postgres -d bodegas_atuel