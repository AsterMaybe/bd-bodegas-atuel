from __future__ import annotations

from typing import Any
from decimal import Decimal

from src.db.pool import get_pool


# ==================== STOCK_DEPOSITO ====================
async def list_stock_deposito(page: int = 1, limit: int = 20) -> dict[str, Any]:
    pool = await get_pool()
    offset = (page - 1) * limit
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT COUNT(*) FROM stock_deposito")
            total = (await cur.fetchone())[0]
            await cur.execute(
                "SELECT codigo_vino, cantidad FROM stock_deposito ORDER BY codigo_vino LIMIT %s OFFSET %s",
                (limit, offset)
            )
            rows = await cur.fetchall()
    return {
        "data": [{"codigo_vino": r[0], "cantidad": r[1]} for r in rows],
        "total": total,
        "page": page,
        "limit": 20,
    }


async def get_stock_deposito(codigo_vino: int) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT codigo_vino, cantidad FROM stock_deposito WHERE codigo_vino = %s", (codigo_vino,))
            row = await cur.fetchone()
    if not row:
        return None
    return {"codigo_vino": row[0], "cantidad": row[1]}


async def create_stock_deposito(data: dict) -> dict:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT INTO stock_deposito (codigo_vino, cantidad) VALUES (%s, %s) RETURNING codigo_vino",
                (data["codigo_vino"], data["cantidad"])
            )
            new_id = (await cur.fetchone())[0]
        await conn.commit()
    return await get_stock_deposito(new_id)


async def update_stock_deposito(codigo_vino: int, data: dict) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            sets = []
            vals = []
            for k, v in data.items():
                sets.append(f"{k} = %s")
                vals.append(v)
            if not sets:
                return await get_stock_deposito(codigo_vino)
            vals.append(codigo_vino)
            await cur.execute(
                f"UPDATE stock_deposito SET {', '.join(sets)} WHERE codigo_vino = %s",
                vals
            )
        await conn.commit()
    return await get_stock_deposito(codigo_vino)


async def delete_stock_deposito(codigo_vino: int) -> bool:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("DELETE FROM stock_deposito WHERE codigo_vino = %s", (codigo_vino,))
            deleted = cur.rowcount > 0
        await conn.commit()
    return deleted


# ==================== STOCK_SALA ====================
async def list_stock_sala(page: int = 1, limit: int = 20) -> dict[str, Any]:
    pool = await get_pool()
    offset = (page - 1) * limit
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT COUNT(*) FROM stock_sala")
            total = (await cur.fetchone())[0]
            await cur.execute(
                "SELECT id_sala, codigo_vino, cantidad FROM stock_sala ORDER BY id_sala, codigo_vino LIMIT %s OFFSET %s",
                (limit, offset)
            )
            rows = await cur.fetchall()
    return {
        "data": [{"id_sala": r[0], "codigo_vino": r[1], "cantidad": r[2]} for r in rows],
        "total": total,
        "page": page,
        "limit": 20,
    }


async def get_stock_sala(id_sala: int, codigo_vino: int) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT id_sala, codigo_vino, cantidad FROM stock_sala WHERE id_sala = %s AND codigo_vino = %s",
                (id_sala, codigo_vino)
            )
            row = await cur.fetchone()
    if not row:
        return None
    return {"id_sala": row[0], "codigo_vino": row[1], "cantidad": row[2]}


async def create_stock_sala(data: dict) -> dict:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT INTO stock_sala (id_sala, codigo_vino, cantidad) VALUES (%s, %s, %s) RETURNING id_sala, codigo_vino",
                (data["id_sala"], data["codigo_vino"], data["cantidad"])
            )
            row = await cur.fetchone()
        await conn.commit()
    return await get_stock_sala(row[0], row[1])


async def update_stock_sala(id_sala: int, codigo_vino: int, data: dict) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            sets = []
            vals = []
            for k, v in data.items():
                sets.append(f"{k} = %s")
                vals.append(v)
            if not sets:
                return await get_stock_sala(id_sala, codigo_vino)
            vals.extend([id_sala, codigo_vino])
            await cur.execute(
                f"UPDATE stock_sala SET {', '.join(sets)} WHERE id_sala = %s AND codigo_vino = %s",
                vals
            )
        await conn.commit()
    return await get_stock_sala(id_sala, codigo_vino)


async def delete_stock_sala(id_sala: int, codigo_vino: int) -> bool:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("DELETE FROM stock_sala WHERE id_sala = %s AND codigo_vino = %s", (id_sala, codigo_vino))
            deleted = cur.rowcount > 0
        await conn.commit()
    return deleted
