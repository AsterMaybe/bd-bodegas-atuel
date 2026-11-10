from __future__ import annotations

from typing import Any

from src.db.pool import get_pool


async def list_bodegas(page: int = 1, limit: int = 20) -> dict[str, Any]:
    pool = await get_pool()
    offset = (page - 1) * limit
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT COUNT(*) FROM bodega")
            total = (await cur.fetchone())[0]
            await cur.execute(
                "SELECT cuit, razon_social, domicilio FROM bodega ORDER BY cuit LIMIT %s OFFSET %s",
                (limit, offset)
            )
            rows = await cur.fetchall()
    return {
        "data": [{"cuit": r[0], "razon_social": r[1], "domicilio": r[2]} for r in rows],
        "total": total,
        "page": page,
        "limit": 20,
    }


async def get_bodega(cuit: str) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT cuit, razon_social, domicilio FROM bodega WHERE cuit = %s", (cuit,))
            row = await cur.fetchone()
    if not row:
        return None
    return {"cuit": row[0], "razon_social": row[1], "domicilio": row[2]}


async def create_bodega(data: dict) -> dict:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT INTO bodega (cuit, razon_social, domicilio) VALUES (%s, %s, %s) RETURNING cuit",
                (data["cuit"], data["razon_social"], data["domicilio"])
            )
            new_cuit = (await cur.fetchone())[0]
        await conn.commit()
    return await get_bodega(new_cuit)


async def update_bodega(cuit: str, data: dict) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            sets = []
            vals = []
            for k, v in data.items():
                sets.append(f"{k} = %s")
                vals.append(v)
            if not sets:
                return await get_bodega(cuit)
            vals.append(cuit)
            await cur.execute(
                f"UPDATE bodega SET {', '.join(sets)} WHERE cuit = %s",
                vals
            )
        await conn.commit()
    return await get_bodega(cuit)


async def delete_bodega(cuit: str) -> bool:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("DELETE FROM bodega WHERE cuit = %s", (cuit,))
            deleted = cur.rowcount > 0
        await conn.commit()
    return deleted
