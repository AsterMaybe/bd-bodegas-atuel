from __future__ import annotations

from typing import Any

from src.db.pool import get_pool, with_transaction


async def list_clientes(
    page: int = 1,
    limit: int = 20,
) -> dict[str, Any]:
    """Lista clientes con paginación."""
    pool = await get_pool()
    async with pool.connection() as conn:
        cur = await conn.execute("SELECT COUNT(*) FROM CLIENTE")
        row = await cur.fetchone()
        total = row[0] if row else 0

        offset = (page - 1) * limit
        sql = """
            SELECT c.id_cliente, c.nombre_razon, c.tipo_doc, c.nro_doc,
                   c.direccion, c.fecha_alta, c.descuento, c.codigo_postal,
                   CASE
                       WHEN s.id_cliente IS NOT NULL THEN 'socio'
                       WHEN d.id_cliente IS NOT NULL THEN 'distribuidor'
                       WHEN e.id_cliente IS NOT NULL THEN 'exportador'
                       ELSE 'cliente'
                   END AS tipo
            FROM CLIENTE c
            LEFT JOIN SOCIO_CLUB s ON s.id_cliente = c.id_cliente
            LEFT JOIN DISTRIBUIDOR d ON d.id_cliente = c.id_cliente
            LEFT JOIN EXPORTADOR e ON e.id_cliente = c.id_cliente
            ORDER BY c.id_cliente
            LIMIT %s OFFSET %s
        """
        cur = await conn.execute(sql, (limit, offset))
        rows = await cur.fetchall()

    columns = [
        "id_cliente", "nombre_razon", "tipo_doc", "nro_doc", "direccion",
        "fecha_alta", "descuento", "codigo_postal", "tipo",
    ]
    data = [dict(zip(columns, r)) for r in rows]
    return {"data": data, "total": total, "page": page, "limit": limit}


async def get_cliente_by_id(id_cliente: int) -> dict[str, Any] | None:
    """Detalle de cliente con datos de subtipo."""
    sql = """
        SELECT c.id_cliente, c.nombre_razon, c.tipo_doc, c.nro_doc,
               c.direccion, c.fecha_alta, c.descuento, c.codigo_postal,
               s.id_cliente AS es_socio,
               d.zona_cobertura, d.nro_habilitacion,
               e.pais_destino
        FROM CLIENTE c
        LEFT JOIN SOCIO_CLUB s ON s.id_cliente = c.id_cliente
        LEFT JOIN DISTRIBUIDOR d ON d.id_cliente = c.id_cliente
        LEFT JOIN EXPORTADOR e ON e.id_cliente = c.id_cliente
        WHERE c.id_cliente = %s
    """
    pool = await get_pool()
    async with pool.connection() as conn:
        cur = await conn.execute(sql, (id_cliente,))
        row = await cur.fetchone()
        if row is None:
            return None

        columns = [
            "id_cliente", "nombre_razon", "tipo_doc", "nro_doc", "direccion",
            "fecha_alta", "descuento", "codigo_postal", "es_socio",
            "zona_cobertura", "nro_habilitacion", "pais_destino",
        ]
        result = dict(zip(columns, row))

        # Determinar tipo
        if result["es_socio"] is not None and result["zona_cobertura"] is None and result["pais_destino"] is None:
            result["tipo"] = "socio"
        elif result["zona_cobertura"] is not None:
            result["tipo"] = "distribuidor"
        elif result["pais_destino"] is not None:
            result["tipo"] = "exportador"
        else:
            result["tipo"] = "cliente"

        # Permisos si es exportador
        if result["tipo"] == "exportador":
            sql_perm = """
                SELECT codigo_permiso, fecha_emision, fecha_venc
                FROM PERMISO_EXPORTADOR
                WHERE id_cliente = %s
            """
            cur = await conn.execute(sql_perm, (id_cliente,))
            perm_rows = await cur.fetchall()
            result["permisos"] = [
                {"codigo_permiso": r[0], "fecha_emision": str(r[1]), "fecha_venc": str(r[2])}
                for r in perm_rows
            ]

        return result


async def create_cliente(data: dict[str, Any]) -> dict[str, Any]:
    """Crea cliente + subtipo en una transacción."""
    async def _create(ctx):
        # Insertar cliente base
        sql_cliente = """
            INSERT INTO CLIENTE (nombre_razon, tipo_doc, nro_doc, direccion,
                                 fecha_alta, descuento, codigo_postal)
            VALUES (%s, %s, %s, %s, CURRENT_DATE, %s, %s)
            RETURNING id_cliente
        """
        cur = await ctx.execute(sql_cliente, (
            data["nombre_razon"], data["tipo_doc"], data["nro_doc"],
            data.get("direccion"), data.get("descuento", 0), data["codigo_postal"],
        ))
        row = await cur.fetchone()
        id_cliente = row[0]

        # Insertar subtipo
        tipo = data["tipo"]
        if tipo == "socio":
            await ctx.execute(
                "INSERT INTO SOCIO_CLUB (id_cliente) VALUES (%s)", (id_cliente,)
            )
        elif tipo == "distribuidor":
            await ctx.execute(
                "INSERT INTO DISTRIBUIDOR (id_cliente, zona_cobertura, nro_habilitacion) VALUES (%s, %s, %s)",
                (id_cliente, data["zona_cobertura"], data["nro_habilitacion"]),
            )
        elif tipo == "exportador":
            await ctx.execute(
                "INSERT INTO EXPORTADOR (id_cliente, pais_destino) VALUES (%s, %s)",
                (id_cliente, data["pais_destino"]),
            )

        return {"id_cliente": id_cliente, **data}

    return await with_transaction(_create)


async def update_cliente(id_cliente: int, data: dict[str, Any]) -> dict[str, Any] | None:
    """Actualiza cliente base."""
    fields = []
    params = []

    for key in ["nombre_razon", "tipo_doc", "nro_doc", "direccion", "codigo_postal", "descuento"]:
        if key in data and data[key] is not None:
            fields.append(f"{key} = %s")
            params.append(data[key])

    if not fields:
        return await get_cliente_by_id(id_cliente)

    params.append(id_cliente)
    sql = f"""
        UPDATE CLIENTE
        SET {", ".join(fields)}
        WHERE id_cliente = %s
        RETURNING id_cliente
    """
    pool = await get_pool()
    async with pool.connection() as conn:
        cur = await conn.execute(sql, params)
        row = await cur.fetchone()
        if row is None:
            return None

    return await get_cliente_by_id(id_cliente)


async def delete_cliente(id_cliente: int) -> bool:
    """Elimina cliente. FK RESTRICT si tiene comprobantes."""
    sql = "DELETE FROM CLIENTE WHERE id_cliente = %s"
    pool = await get_pool()
    async with pool.connection() as conn:
        cur = await conn.execute(sql, (id_cliente,))
        return cur.rowcount > 0