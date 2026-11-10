from __future__ import annotations

from typing import Any
from datetime import date
from decimal import Decimal

from src.db.pool import get_pool


# ==================== LOTE_UVA ====================
async def list_lotes(page: int = 1, limit: int = 20) -> dict[str, Any]:
    pool = await get_pool()
    offset = (page - 1) * limit
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT COUNT(*) FROM lote_uva")
            total = (await cur.fetchone())[0]
            await cur.execute(
                "SELECT nro_lote, campaña, fecha_cosecha, kg, nro_parcela, id_finca, cuit_bodega FROM lote_uva ORDER BY nro_lote LIMIT %s OFFSET %s",
                (limit, offset)
            )
            rows = await cur.fetchall()
    return {
        "data": [{"nro_lote": r[0], "campaña": r[1], "fecha_cosecha": str(r[2]), "kg": float(r[3]), "nro_parcela": r[4], "id_finca": r[5], "cuit_bodega": r[6]} for r in rows],
        "total": total,
        "page": page,
        "limit": 20,
    }


async def get_lote(nro_lote: int) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT nro_lote, campaña, fecha_cosecha, kg, nro_parcela, id_finca, cuit_bodega FROM lote_uva WHERE nro_lote = %s",
                (nro_lote,)
            )
            row = await cur.fetchone()
    if not row:
        return None
    return {"nro_lote": row[0], "campaña": row[1], "fecha_cosecha": str(row[2]), "kg": float(row[3]), "nro_parcela": row[4], "id_finca": row[5], "cuit_bodega": row[6]}


async def create_lote(data: dict) -> dict:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT INTO lote_uva (campaña, fecha_cosecha, kg, nro_parcela, id_finca, cuit_bodega) VALUES (%s, %s, %s, %s, %s, %s) RETURNING nro_lote",
                (data["campaña"], data["fecha_cosecha"], data["kg"], data["nro_parcela"], data["id_finca"], data["cuit_bodega"])
            )
            new_id = (await cur.fetchone())[0]
        await conn.commit()
    return await get_lote(new_id)


async def update_lote(nro_lote: int, data: dict) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            sets = []
            vals = []
            for k, v in data.items():
                sets.append(f"{k} = %s")
                vals.append(v)
            if not sets:
                return await get_lote(nro_lote)
            vals.append(nro_lote)
            await cur.execute(
                f"UPDATE lote_uva SET {', '.join(sets)} WHERE nro_lote = %s",
                vals
            )
        await conn.commit()
    return await get_lote(nro_lote)


async def delete_lote(nro_lote: int) -> bool:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("DELETE FROM lote_uva WHERE nro_lote = %s", (nro_lote,))
            deleted = cur.rowcount > 0
        await conn.commit()
    return deleted


# ==================== ANALISIS_CALIDAD ====================
async def list_analisis(page: int = 1, limit: int = 20) -> dict[str, Any]:
    pool = await get_pool()
    offset = (page - 1) * limit
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT COUNT(*) FROM analisis_calidad")
            total = (await cur.fetchone())[0]
            await cur.execute(
                "SELECT id_analisis, fecha, brix, ph, acidez, nro_lote FROM analisis_calidad ORDER BY id_analisis LIMIT %s OFFSET %s",
                (limit, offset)
            )
            rows = await cur.fetchall()
    return {
        "data": [{"id_analisis": r[0], "fecha": str(r[1]), "brix": float(r[2]), "ph": float(r[3]), "acidez": float(r[4]), "nro_lote": r[5]} for r in rows],
        "total": total,
        "page": page,
        "limit": 20,
    }


async def get_analisis(id_analisis: int) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT id_analisis, fecha, brix, ph, acidez, nro_lote FROM analisis_calidad WHERE id_analisis = %s",
                (id_analisis,)
            )
            row = await cur.fetchone()
    if not row:
        return None
    return {"id_analisis": row[0], "fecha": str(row[1]), "brix": float(row[2]), "ph": float(row[3]), "acidez": float(row[4]), "nro_lote": row[5]}


async def create_analisis(data: dict) -> dict:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT INTO analisis_calidad (fecha, brix, ph, acidez, nro_lote) VALUES (%s, %s, %s, %s, %s) RETURNING id_analisis",
                (data["fecha"], data["brix"], data["ph"], data["acidez"], data["nro_lote"])
            )
            new_id = (await cur.fetchone())[0]
        await conn.commit()
    return await get_analisis(new_id)


async def update_analisis(id_analisis: int, data: dict) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            sets = []
            vals = []
            for k, v in data.items():
                sets.append(f"{k} = %s")
                vals.append(v)
            if not sets:
                return await get_analisis(id_analisis)
            vals.append(id_analisis)
            await cur.execute(
                f"UPDATE analisis_calidad SET {', '.join(sets)} WHERE id_analisis = %s",
                vals
            )
        await conn.commit()
    return await get_analisis(id_analisis)


async def delete_analisis(id_analisis: int) -> bool:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("DELETE FROM analisis_calidad WHERE id_analisis = %s", (id_analisis,))
            deleted = cur.rowcount > 0
        await conn.commit()
    return deleted
