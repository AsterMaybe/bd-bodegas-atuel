from __future__ import annotations

from typing import Any

from src.db.pool import get_pool, with_transaction


async def create_ingreso(data: dict[str, Any]) -> dict[str, Any]:
    """Crea ingreso en estado en_confeccion."""
    sql = """
        INSERT INTO INGRESO (fecha, estado, cuit_bodega, codigo_transp)
        VALUES (CURRENT_DATE, 'en_confeccion', %s, %s)
        RETURNING id_documento, fecha, estado, cuit_bodega, codigo_transp
    """
    pool = await get_pool()
    async with pool.connection() as conn:
        cur = await conn.execute(sql, (data["cuit_bodega"], data["codigo_transp"]))
        row = await cur.fetchone()

    columns = ["id_documento", "fecha", "estado", "cuit_bodega", "codigo_transp"]
    result = dict(zip(columns, row))
    result["renglones"] = []
    return result


async def add_renglones_ingreso(id_documento: int, renglones: list[dict[str, Any]]) -> dict[str, Any]:
    """Agrega renglones a un ingreso (solo si está en_confeccion)."""
    async def _add(ctx):
        for reng in renglones:
            sql = """
                INSERT INTO RENGLON_INGRESO (id_documento, codigo_vino, cantidad)
                VALUES (%s, %s, %s)
            """
            await ctx.execute(sql, (id_documento, reng["codigo_vino"], reng["cantidad"]))
        return True

    await with_transaction(_add)
    return await get_ingreso_by_id(id_documento)


async def procesar_ingreso(id_documento: int) -> dict[str, Any] | None:
    """Procesa ingreso invocando el procedimiento almacenado.
    Nota: el ingreso debe estar en estado 'terminado' para procesarse.
    El procedimiento sp_procesar_ingreso valida el estado.
    """
    async def _procesar(ctx):
        await ctx.execute("CALL sp_procesar_ingreso(%s)", (id_documento,))
        return True

    await with_transaction(_procesar)

    pool = await get_pool()
    async with pool.connection() as conn:
        cur = await conn.execute(
            "SELECT id_documento, fecha, estado, cuit_bodega, codigo_transp FROM INGRESO WHERE id_documento = %s",
            (id_documento,),
        )
        row = await cur.fetchone()
        if row is None:
            return None
        columns = ["id_documento", "fecha", "estado", "cuit_bodega", "codigo_transp"]
        return dict(zip(columns, row))


async def get_ingreso_by_id(id_documento: int) -> dict[str, Any] | None:
    """Detalle de ingreso con renglones."""
    pool = await get_pool()
    async with pool.connection() as conn:
        cur = await conn.execute(
            "SELECT id_documento, fecha, estado, cuit_bodega, codigo_transp FROM INGRESO WHERE id_documento = %s",
            (id_documento,),
        )
        row = await cur.fetchone()
        if row is None:
            return None

        columns = ["id_documento", "fecha", "estado", "cuit_bodega", "codigo_transp"]
        result = dict(zip(columns, row))

        cur = await conn.execute(
            "SELECT id_documento, codigo_vino, cantidad FROM RENGLON_INGRESO WHERE id_documento = %s",
            (id_documento,),
        )
        reng_rows = await cur.fetchall()
        reng_cols = ["id_documento", "codigo_vino", "cantidad"]
        result["renglones"] = [dict(zip(reng_cols, r)) for r in reng_rows]

        return result