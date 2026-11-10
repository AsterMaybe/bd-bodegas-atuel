from __future__ import annotations

from typing import Any
from decimal import Decimal

from src.db.pool import get_pool


async def list_fincas(page: int = 1, limit: int = 20) -> dict[str, Any]:
    pool = await get_pool()
    offset = (page - 1) * limit
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT COUNT(*) FROM finca")
            total = (await cur.fetchone())[0]
            await cur.execute(
                "SELECT id_finca, nombre, superficie_ha, id_depto FROM finca ORDER BY id_finca LIMIT %s OFFSET %s",
                (limit, offset)
            )
            rows = await cur.fetchall()
    return {
        "data": [{"id_finca": r[0], "nombre": r[1], "superficie_ha": float(r[2]), "id_depto": r[3]} for r in rows],
        "total": total,
        "page": page,
        "limit": 20,
    }


async def get_finca(id_finca: int) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT id_finca, nombre, superficie_ha, id_depto FROM finca WHERE id_finca = %s",
                (id_finca,)
            )
            row = await cur.fetchone()
    if not row:
        return None
    return {"id_finca": row[0], "nombre": row[1], "superficie_ha": float(row[2]), "id_depto": row[3]}


async def create_finca(data: dict) -> dict:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT INTO finca (nombre, superficie_ha, id_depto) VALUES (%s, %s, %s) RETURNING id_finca",
                (data["nombre"], data["superficie_ha"], data["id_depto"])
            )
            new_id = (await cur.fetchone())[0]
        await conn.commit()
    return await get_finca(new_id)


async def update_finca(id_finca: int, data: dict) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            sets = []
            vals = []
            for k, v in data.items():
                sets.append(f"{k} = %s")
                vals.append(v)
            if not sets:
                return await get_finca(id_finca)
            vals.append(id_finca)
            await cur.execute(
                f"UPDATE finca SET {', '.join(sets)} WHERE id_finca = %s",
                vals
            )
        await conn.commit()
    return await get_finca(id_finca)


async def delete_finca(id_finca: int) -> bool:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("DELETE FROM finca WHERE id_finca = %s", (id_finca,))
            deleted = cur.rowcount > 0
        await conn.commit()
    return deleted
