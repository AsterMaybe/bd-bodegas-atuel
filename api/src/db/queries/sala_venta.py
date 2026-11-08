from __future__ import annotations

from typing import Any

from src.db.pool import get_pool


async def list_salas(page: int = 1, limit: int = 20) -> dict[str, Any]:
    pool = await get_pool()
    offset = (page - 1) * limit
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT COUNT(*) FROM sala_venta")
            total = (await cur.fetchone())[0]
            await cur.execute(
                "SELECT id_sala, numero, calle, dia_de_cierre, codigo_postal FROM sala_venta ORDER BY id_sala LIMIT %s OFFSET %s",
                (limit, offset)
            )
            rows = await cur.fetchall()
    return {
        "data": [{"id_sala": r[0], "numero": r[1], "calle": r[2], "dia_de_cierre": r[3], "codigo_postal": r[4]} for r in rows],
        "total": total,
        "page": page,
        "limit": 20,
    }


async def get_sala(id_sala: int) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT id_sala, numero, calle, dia_de_cierre, codigo_postal FROM sala_venta WHERE id_sala = %s",
                (id_sala,)
            )
            row = await cur.fetchone()
    if not row:
        return None
    return {"id_sala": row[0], "numero": row[1], "calle": row[2], "dia_de_cierre": row[3], "codigo_postal": row[4]}


async def create_sala(data: dict) -> dict:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT INTO sala_venta (numero, calle, dia_de_cierre, codigo_postal) VALUES (%s, %s, %s, %s) RETURNING id_sala",
                (data["numero"], data["calle"], data.get("dia_de_cierre"), data["codigo_postal"])
            )
            new_id = (await cur.fetchone())[0]
        await conn.commit()
    return await get_sala(new_id)


async def update_sala(id_sala: int, data: dict) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            sets = []
            vals = []
            for k, v in data.items():
                sets.append(f"{k} = %s")
                vals.append(v)
            if not sets:
                return await get_sala(id_sala)
            vals.append(id_sala)
            await cur.execute(
                f"UPDATE sala_venta SET {', '.join(sets)} WHERE id_sala = %s",
                vals
            )
        await conn.commit()
    return await get_sala(id_sala)


async def delete_sala(id_sala: int) -> bool:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("DELETE FROM sala_venta WHERE id_sala = %s", (id_sala,))
            deleted = cur.rowcount > 0
        await conn.commit()
    return deleted
