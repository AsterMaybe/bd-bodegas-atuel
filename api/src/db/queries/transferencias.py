from __future__ import annotations

from typing import Any

from src.db.pool import get_pool, with_transaction


async def create_transferencia(data: dict[str, Any]) -> dict[str, Any]:
    """Crea transferencia en estado en_confeccion."""
    sql = """
        INSERT INTO TRANSFERENCIA (fecha, estado, id_sala)
        VALUES (CURRENT_DATE, 'en_confeccion', %s)
        RETURNING id_documento, fecha, estado, id_sala
    """
    pool = await get_pool()
    async with pool.connection() as conn:
        cur = await conn.execute(sql, (data["id_sala"],))
        row = await cur.fetchone()

    columns = ["id_documento", "fecha", "estado", "id_sala"]
    result = dict(zip(columns, row))
    result["renglones"] = []
    return result


async def add_renglones_transferencia(id_documento: int, renglones: list[dict[str, Any]]) -> dict[str, Any]:
    """Agrega renglones a una transferencia (solo si está en_confeccion)."""
    async def _add(ctx):
        for reng in renglones:
            sql = """
                INSERT INTO RENGLON_TRANSFERENCIA (id_documento, codigo_vino, cantidad)
                VALUES (%s, %s, %s)
            """
            await ctx.execute(sql, (id_documento, reng["codigo_vino"], reng["cantidad"]))
        return True

    await with_transaction(_add)
    return await get_transferencia_by_id(id_documento)


async def terminar_transferencia(id_documento: int) -> dict[str, Any] | None:
    """Cambia estado a 'terminado' (trigger valida transición)."""
    sql = """
        UPDATE TRANSFERENCIA
        SET estado = 'terminado'
        WHERE id_documento = %s
        RETURNING id_documento, fecha, estado, id_sala
    """
    pool = await get_pool()
    async with pool.connection() as conn:
        cur = await conn.execute(sql, (id_documento,))
        row = await cur.fetchone()
        if row is None:
            return None

    columns = ["id_documento", "fecha", "estado", "id_sala"]
    result = dict(zip(columns, row))
    return result


async def procesar_transferencia(id_documento: int) -> dict[str, Any] | None:
    """Procesa transferencia invocando el procedimiento almacenado."""
    async def _procesar(ctx):
        await ctx.execute("CALL sp_procesar_transferencia(%s)", (id_documento,))
        return True

    await with_transaction(_procesar)

    # Obtener estado actualizado
    pool = await get_pool()
    async with pool.connection() as conn:
        cur = await conn.execute(
            "SELECT id_documento, fecha, estado, id_sala FROM TRANSFERENCIA WHERE id_documento = %s",
            (id_documento,),
        )
        row = await cur.fetchone()
        if row is None:
            return None
        columns = ["id_documento", "fecha", "estado", "id_sala"]
        return dict(zip(columns, row))


async def list_transferencias(
    page: int = 1,
    limit: int = 20,
    estado: str | None = None,
    search: str | None = None,
) -> dict[str, Any]:
    """Lista transferencias con paginación, filtro por estado y búsqueda."""
    page = max(1, page)
    limit = min(max(1, limit), 100)

    pool = await get_pool()
    async with pool.connection() as conn:
        where_clauses = []
        params = []

        if estado and estado != "all":
            where_clauses.append("estado = %s")
            params.append(estado)

        if search:
            # Buscar por ID de transferencia o ID de sala
            where_clauses.append("(id_documento::text ILIKE %s OR id_sala::text ILIKE %s)")
            like = f"%{search}%"
            params.extend([like, like])

        where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""

        # Count total
        count_sql = f"SELECT COUNT(*) FROM TRANSFERENCIA {where_sql}"
        cur = await conn.execute(count_sql, params)
        total = (await cur.fetchone())[0] or 0

        # Data paginada
        offset = (page - 1) * limit
        data_sql = f"""
            SELECT id_documento, fecha, estado, id_sala
            FROM TRANSFERENCIA
            {where_sql}
            ORDER BY id_documento
            LIMIT %s OFFSET %s
        """
        params.extend([limit, offset])
        cur = await conn.execute(data_sql, params)
        rows = await cur.fetchall()

    data = [{"id_documento": r[0], "fecha": str(r[1]), "estado": r[2], "id_sala": r[3]} for r in rows]
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


async def get_transferencia_by_id(id_documento: int) -> dict[str, Any] | None:
    """Detalle de transferencia con renglones."""
    pool = await get_pool()
    async with pool.connection() as conn:
        cur = await conn.execute(
            "SELECT id_documento, fecha, estado, id_sala FROM TRANSFERENCIA WHERE id_documento = %s",
            (id_documento,),
        )
        row = await cur.fetchone()
        if row is None:
            return None

        columns = ["id_documento", "fecha", "estado", "id_sala"]
        result = dict(zip(columns, row))

        cur = await conn.execute(
            "SELECT id_documento, codigo_vino, cantidad FROM RENGLON_TRANSFERENCIA WHERE id_documento = %s",
            (id_documento,),
        )
        reng_rows = await cur.fetchall()
        reng_cols = ["id_documento", "codigo_vino", "cantidad"]
        result["renglones"] = [dict(zip(reng_cols, r)) for r in reng_rows]

        return result
