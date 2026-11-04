from __future__ import annotations

from typing import Any

from src.db.pool import get_pool, with_transaction


async def create_comprobante(data: dict[str, Any]) -> dict[str, Any]:
    """Crea comprobante + renglones en una transacción.
    Los triggers BD calculan precio, descuento, stock y totales.
    """
    async def _create(ctx):
        # Insertar cabecera
        sql_cab = """
            INSERT INTO COMPROBANTE (id_cliente, id_sala, fecha, subtotal, descuento, total)
            VALUES (%s, %s, CURRENT_TIMESTAMP, 0, 0, 0)
            RETURNING nro_comprob
        """
        cur = await ctx.execute(sql_cab, (data["id_cliente"], data["id_sala"]))
        row = await cur.fetchone()
        nro_comprob = row[0]

        # Insertar renglones (triggers validan stock y calculan importes)
        for reng in data["renglones"]:
            sql_reng = """
                INSERT INTO RENGLON_COMPROBANTE (nro_comprob, codigo_vino, cantidad,
                                                 precio_unitario, descuento, subtotal)
                VALUES (%s, %s, %s, 0, 0, 0)
            """
            await ctx.execute(sql_reng, (
                nro_comprob, reng["codigo_vino"], reng["cantidad"],
            ))

        return {"nro_comprob": nro_comprob, **data}

    result = await with_transaction(_create)
    return await get_comprobante_by_id(result["nro_comprob"])


async def get_comprobante_by_id(nro_comprob: int) -> dict[str, Any] | None:
    """Detalle de comprobante con renglones."""
    pool = await get_pool()
    async with pool.connection() as conn:
        cur = await conn.execute(
            """SELECT nro_comprob, fecha, subtotal, descuento, total, id_cliente, id_sala
               FROM COMPROBANTE WHERE nro_comprob = %s""",
            (nro_comprob,),
        )
        row = await cur.fetchone()
        if row is None:
            return None

        columns = ["nro_comprob", "fecha", "subtotal", "descuento", "total", "id_cliente", "id_sala"]
        result = dict(zip(columns, row))

        # Renglones
        cur = await conn.execute(
            """SELECT nro_comprob, codigo_vino, cantidad, precio_unitario, descuento, subtotal
               FROM RENGLON_COMPROBANTE WHERE nro_comprob = %s""",
            (nro_comprob,),
        )
        reng_rows = await cur.fetchall()
        reng_cols = ["nro_comprob", "codigo_vino", "cantidad", "precio_unitario", "descuento", "subtotal"]
        result["renglones"] = [dict(zip(reng_cols, r)) for r in reng_rows]

        return result