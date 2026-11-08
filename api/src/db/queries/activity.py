from datetime import date, timedelta
from typing import Optional
from src.db.pool import with_transaction_ro


async def list_actividad(
    page: int = 1,
    limit: int = 20,
    tabla: Optional[str] = None,
    operacion: Optional[str] = None,
    usuario: Optional[str] = None,
    desde: Optional[date] = None,
    hasta: Optional[date] = None,
    search: Optional[str] = None,
) -> dict:
    """Lista registros de auditoría con filtros y paginación."""
    offset = (page - 1) * limit

    where_clauses = []
    params = []

    if tabla:
        where_clauses.append("tabla_afectada = %s")
        params.append(tabla)

    if operacion:
        where_clauses.append("operacion = %s")
        params.append(operacion)

    if usuario:
        where_clauses.append("usuario ILIKE %s")
        params.append(f"%{usuario}%")

    if desde:
        where_clauses.append("fecha_hora >= %s")
        params.append(desde)

    if hasta:
        # hasta inclusive: agregar 1 día para cubrir todo el día
        where_clauses.append("fecha_hora < %s")
        params.append(hasta + timedelta(days=1))

    if search:
        where_clauses.append("descripcion ILIKE %s")
        params.append(f"%{search}%")

    where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""

    # Query de conteo
    count_sql = "SELECT COUNT(*) FROM AUDITORIA_ACTIVIDAD " + where_sql

    # Query de datos
    data_sql = (
        "SELECT id_auditoria, tabla_afectada, operacion, id_registro, "
        "datos_anteriores, datos_nuevos, usuario, fecha_hora, descripcion "
        "FROM AUDITORIA_ACTIVIDAD "
        + where_sql +
        " ORDER BY fecha_hora DESC "
        "LIMIT %s OFFSET %s"
    )

    params_data = params + [limit, offset]

    async def _query(ctx):
        if params:
            total_row = await ctx.fetchone(count_sql, tuple(params))
        else:
            total_row = await ctx.fetchone(count_sql)
        total = total_row[0] if total_row else 0

        rows = await ctx.fetchall(data_sql, tuple(params_data))
        # Convertir tuplas a dicts con nombres de columnas
        columns = [
            "id_auditoria", "tabla_afectada", "operacion", "id_registro",
            "datos_anteriores", "datos_nuevos", "usuario", "fecha_hora", "descripcion"
        ]
        data = [dict(zip(columns, r)) for r in rows]

        total_pages = (total + limit - 1) // limit if total > 0 else 1

        return {
            "data": data,
            "metadata": {
                "total": total,
                "page": page,
                "limit": limit,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1,
            },
        }

    return await with_transaction_ro(_query)


async def get_actividad_by_id(id_auditoria: int) -> Optional[dict]:
    """Obtiene un registro de auditoría por ID."""
    sql = """
        SELECT id_auditoria, tabla_afectada, operacion, id_registro,
               datos_anteriores, datos_nuevos, usuario, fecha_hora, descripcion
        FROM AUDITORIA_ACTIVIDAD
        WHERE id_auditoria = %s
    """

    async def _query(ctx):
        row = await ctx.fetchone(sql, (id_auditoria,))
        return dict(row) if row else None

    return await with_transaction_ro(_query)