from __future__ import annotations

from typing import Any
from decimal import Decimal

from src.db.pool import get_pool


async def list_parcelas(page: int = 1, limit: int = 20) -> dict[str, Any]:
    pool = await get_pool()
    offset = (page - 1) * limit
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT COUNT(*) FROM parcela")
            total = (await cur.fetchone())[0]
            await cur.execute(
                "SELECT nro_parcela, id_finca, superficie, año_plantacion, id_cepa FROM parcela ORDER BY id_finca, nro_parcela LIMIT %s OFFSET %s",
                (limit, offset)
            )
            rows = await cur.fetchall()
    return {
        "data": [{"nro_parcela": r[0], "id_finca": r[1], "superficie": float(r[2]), "año_plantacion": r[3], "id_cepa": r[4]} for r in rows],
        "total": total,
        "page": page,
        "limit": 20,
    }


async def get_parcela(nro_parcela: int, id_finca: int) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT nro_parcela, id_finca, superficie, año_plantacion, id_cepa FROM parcela WHERE nro_parcela = %s AND id_finca = %s",
                (nro_parcela, id_finca)
            )
            row = await cur.fetchone()
    if not row:
        return None
    return {"nro_parcela": row[0], "id_finca": row[1], "superficie": float(row[2]), "año_plantacion": row[3], "id_cepa": row[4]}


async def create_parcela(data: dict) -> dict:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT INTO parcela (nro_parcela, id_finca, superficie, año_plantacion, id_cepa) VALUES (%s, %s, %s, %s, %s) RETURNING nro_parcela, id_finca",
                (data["nro_parcela"], data["id_finca"], data["superficie"], data["año_plantacion"], data["id_cepa"])
            )
            row = await cur.fetchone()
        await conn.commit()
    return await get_parcela(row[0], row[1])


async def update_parcela(nro_parcela: int, id_finca: int, data: dict) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            sets = []
            vals = []
            for k, v in data.items():
                sets.append(f"{k} = %s")
                vals.append(v)
            if not sets:
                return await get_parcela(nro_parcela, id_finca)
            vals.extend([nro_parcela, id_finca])
            await cur.execute(
                f"UPDATE parcela SET {', '.join(sets)} WHERE nro_parcela = %s AND id_finca = %s",
                vals
            )
        await conn.commit()
    return await get_parcela(nro_parcela, id_finca)


async def delete_parcela(nro_parcela: int, id_finca: int) -> bool:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("DELETE FROM parcela WHERE nro_parcela = %s AND id_finca = %s", (nro_parcela, id_finca))
            deleted = cur.rowcount > 0
        await conn.commit()
    return deleted
