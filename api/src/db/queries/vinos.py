from __future__ import annotations

from typing import Any

from src.db.pool import get_pool, with_transaction


async def list_vinos(
    tipo: str | None = None,
    cepa: int | None = None,
    bodega: str | None = None,
    aniada: int | None = None,
    page: int = 1,
    limit: int = 20,
) -> dict[str, Any]:
    """Lista vinos con filtros y paginación."""
    conditions: list[str] = []
    params: list[Any] = []

    if tipo is not None:
        conditions.append("v.tipo = %s")
        params.append(tipo)
    if cepa is not None:
        conditions.append("cv.id_cepa = %s")
        params.append(cepa)
    if bodega is not None:
        conditions.append("v.cuit_bodega = %s")
        params.append(bodega)
    if aniada is not None:
        conditions.append("v.añada = %s")
        params.append(aniada)

    where_clause = " AND ".join(conditions) if conditions else "TRUE"

    # Count total
    count_sql = f"""
        SELECT COUNT(DISTINCT v.codigo_vino) AS total
        FROM VINO v
        LEFT JOIN COMPOSICION_VINO cv ON cv.codigo_vino = v.codigo_vino
        WHERE {where_clause}
    """
    pool = await get_pool()
    async with pool.connection() as conn:
        cur = await conn.execute(count_sql, params)
        row = await cur.fetchone()
        total = row[0] if row else 0

    # Data
    offset = (page - 1) * limit
    data_sql = f"""
        SELECT v.codigo_vino, v.nombre, v.tipo, v.añada, v.volumen_ml,
               v.graduacion, v.precio, v.cuit_bodega,
               b.razon_social AS bodega_elaboradora
        FROM VINO v
        JOIN BODEGA b ON b.cuit = v.cuit_bodega
        LEFT JOIN COMPOSICION_VINO cv ON cv.codigo_vino = v.codigo_vino
        WHERE {where_clause}
        GROUP BY v.codigo_vino, b.razon_social
        ORDER BY v.codigo_vino
        LIMIT %s OFFSET %s
    """
    params_data = params + [limit, offset]
    async with pool.connection() as conn:
        cur = await conn.execute(data_sql, params_data)
        rows = await cur.fetchall()

    columns = [
        "codigo_vino", "nombre", "tipo", "aniada", "volumen_ml",
        "graduacion", "precio", "cuit_bodega", "bodega_elaboradora",
    ]
    data = [dict(zip(columns, r)) for r in rows]

    return {"data": data, "total": total, "page": page, "limit": limit}


async def get_vino_by_id(codigo_vino: int) -> dict[str, Any] | None:
    """Detalle de vino con composición (cepas + %) y maridajes."""
    sql = """
        SELECT v.codigo_vino, v.nombre, v.tipo, v.añada, v.volumen_ml,
               v.graduacion, v.precio, v.cuit_bodega,
               b.razon_social AS bodega_elaboradora,
               COALESCE(
                   (SELECT json_agg(json_build_object(
                       'id_cepa', c.id_cepa,
                       'nombre', c.nombre,
                       'tipo', c.tipo,
                       'porcentaje', cv.porcentaje
                   ) ORDER BY c.id_cepa)
                    FROM COMPOSICION_VINO cv
                    JOIN CEPA c ON c.id_cepa = cv.id_cepa
                    WHERE cv.codigo_vino = v.codigo_vino),
                   '[]'::json
               ) AS composicion,
               COALESCE(
                   (SELECT json_agg(json_build_object(
                       'id_maridaje', m.id_maridaje,
                       'nombre', m.nombre,
                       'temp_servicio', m.temp_servicio
                   ) ORDER BY m.id_maridaje)
                    FROM VINO_MARIDAJE vm
                    JOIN MARIDAJE m ON m.id_maridaje = vm.id_maridaje
                    WHERE vm.codigo_vino = v.codigo_vino),
                   '[]'::json
               ) AS maridajes,
               COALESCE(sd.cantidad, 0) AS stock_deposito,
               COALESCE(ss.stock_salas, 0) AS stock_total_salas,
               COALESCE(sd.cantidad, 0) + COALESCE(ss.stock_salas, 0) AS stock_global
        FROM VINO v
        JOIN BODEGA b ON b.cuit = v.cuit_bodega
        LEFT JOIN STOCK_DEPOSITO sd ON sd.codigo_vino = v.codigo_vino
        LEFT JOIN (
            SELECT codigo_vino, SUM(cantidad)::INTEGER AS stock_salas
            FROM STOCK_SALA
            GROUP BY codigo_vino
        ) ss ON ss.codigo_vino = v.codigo_vino
        WHERE v.codigo_vino = %s
    """
    pool = await get_pool()
    async with pool.connection() as conn:
        cur = await conn.execute(sql, (codigo_vino,))
        row = await cur.fetchone()
        if row is None:
            return None

        columns = [
            "codigo_vino", "nombre", "tipo", "aniada", "volumen_ml",
            "graduacion", "precio", "cuit_bodega", "bodega_elaboradora",
            "composicion", "maridajes", "stock_deposito", "stock_total_salas",
            "stock_global",
        ]
        return dict(zip(columns, row))


async def create_vino(data: dict[str, Any]) -> dict[str, Any]:
    """Crea vino + composición en una transacción."""
    async def _create(ctx):
        # Insertar vino
        sql_vino = """
            INSERT INTO VINO (nombre, tipo, añada, volumen_ml, graduacion, precio, cuit_bodega)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING codigo_vino
        """
        cur = await ctx.execute(sql_vino, (
            data["nombre"], data["tipo"], data["aniada"], data["volumen_ml"],
            data["graduacion"], data["precio"], data["cuit_bodega"],
        ))
        row = await cur.fetchone()
        codigo_vino = row[0]

        # Insertar composición
        for comp in data["composicion"]:
            sql_comp = """
                INSERT INTO COMPOSICION_VINO (codigo_vino, id_cepa, porcentaje)
                VALUES (%s, %s, %s)
            """
            await ctx.execute(sql_comp, (codigo_vino, comp["id_cepa"], comp["porcentaje"]))

        # El trigger de composición (deferred) validará que sume 100 al COMMIT
        return {"codigo_vino": codigo_vino, **data}

    return await with_transaction(_create)


async def update_vino(codigo_vino: int, data: dict[str, Any]) -> dict[str, Any] | None:
    """Actualiza vino. El trigger audita el precio si cambia."""
    fields = []
    params = []

    for key in ["nombre", "tipo", "aniada", "volumen_ml", "graduacion", "precio", "cuit_bodega"]:
        if key in data and data[key] is not None:
            fields.append(f"{key} = %s")
            params.append(data[key])

    if not fields:
        return await get_vino_by_id(codigo_vino)

    params.append(codigo_vino)
    sql = f"""
        UPDATE VINO
        SET {", ".join(fields)}
        WHERE codigo_vino = %s
        RETURNING codigo_vino
    """
    pool = await get_pool()
    async with pool.connection() as conn:
        cur = await conn.execute(sql, params)
        row = await cur.fetchone()
        if row is None:
            return None

    return await get_vino_by_id(codigo_vino)


async def delete_vino(codigo_vino: int) -> bool:
    """Elimina vino. FK RESTRICT si tiene movimientos."""
    sql = "DELETE FROM VINO WHERE codigo_vino = %s"
    pool = await get_pool()
    async with pool.connection() as conn:
        cur = await conn.execute(sql, (codigo_vino,))
        return cur.rowcount > 0