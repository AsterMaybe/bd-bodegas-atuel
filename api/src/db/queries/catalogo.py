from __future__ import annotations

from typing import Any
from decimal import Decimal

from src.db.pool import get_pool


# ==================== DEPARTAMENTO ====================
async def list_departamentos(page: int = 1, limit: int = 20) -> dict[str, Any]:
    pool = await get_pool()
    offset = (page - 1) * limit
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT COUNT(*) FROM departamento")
            total = (await cur.fetchone())[0]
            await cur.execute(
                "SELECT id_depto, nombre_depto, provincia FROM departamento ORDER BY id_depto LIMIT %s OFFSET %s",
                (limit, offset)
            )
            rows = await cur.fetchall()
    return {
        "data": [{"id_depto": r[0], "nombre_depto": r[1], "provincia": r[2]} for r in rows],
        "total": total,
        "page": page,
        "limit": 20,
    }


async def get_departamento(id_depto: int) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT id_depto, nombre_depto, provincia FROM departamento WHERE id_depto = %s",
                (id_depto,)
            )
            row = await cur.fetchone()
    if not row:
        return None
    return {"id_depto": row[0], "nombre_depto": row[1], "provincia": row[2]}


async def create_departamento(data: dict) -> dict:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT INTO departamento (nombre_depto, provincia) VALUES (%s, %s) RETURNING id_depto",
                (data["nombre_depto"], data["provincia"])
            )
            new_id = (await cur.fetchone())[0]
        await conn.commit()
    return await get_departamento(new_id)


async def update_departamento(id_depto: int, data: dict) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            sets = []
            vals = []
            for k, v in data.items():
                sets.append(f"{k} = %s")
                vals.append(v)
            if not sets:
                return await get_departamento(id_depto)
            vals.append(id_depto)
            await cur.execute(
                f"UPDATE departamento SET {', '.join(sets)} WHERE id_depto = %s",
                vals
            )
        await conn.commit()
    return await get_departamento(id_depto)


async def delete_departamento(id_depto: int) -> bool:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("DELETE FROM departamento WHERE id_depto = %s", (id_depto,))
            deleted = cur.rowcount > 0
        await conn.commit()
    return deleted


# ==================== LOCALIDAD ====================
async def list_localidades(page: int = 1, limit: int = 20) -> dict[str, Any]:
    pool = await get_pool()
    offset = (page - 1) * limit
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT COUNT(*) FROM localidad")
            total = (await cur.fetchone())[0]
            await cur.execute(
                "SELECT codigo_postal, provincia, nombre, cuit_encargado FROM localidad ORDER BY codigo_postal LIMIT %s OFFSET %s",
                (limit, offset)
            )
            rows = await cur.fetchall()
    return {
        "data": [{"codigo_postal": r[0], "provincia": r[1], "nombre": r[2], "cuit_encargado": r[3]} for r in rows],
        "total": total,
        "page": page,
        "limit": 20,
    }


async def get_localidad(codigo_postal: str) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT codigo_postal, provincia, nombre, cuit_encargado FROM localidad WHERE codigo_postal = %s",
                (codigo_postal,)
            )
            row = await cur.fetchone()
    if not row:
        return None
    return {"codigo_postal": row[0], "provincia": row[1], "nombre": row[2], "cuit_encargado": row[3]}


async def create_localidad(data: dict) -> dict:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT INTO localidad (codigo_postal, provincia, nombre, cuit_encargado) VALUES (%s, %s, %s, %s) RETURNING codigo_postal",
                (data["codigo_postal"], data["provincia"], data["nombre"], data["cuit_encargado"])
            )
            new_id = (await cur.fetchone())[0]
        await conn.commit()
    return await get_localidad(new_id)


async def update_localidad(codigo_postal: str, data: dict) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            sets = []
            vals = []
            for k, v in data.items():
                sets.append(f"{k} = %s")
                vals.append(v)
            if not sets:
                return await get_localidad(codigo_postal)
            vals.append(codigo_postal)
            await cur.execute(
                f"UPDATE localidad SET {', '.join(sets)} WHERE codigo_postal = %s",
                vals
            )
        await conn.commit()
    return await get_localidad(codigo_postal)


async def delete_localidad(codigo_postal: str) -> bool:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("DELETE FROM localidad WHERE codigo_postal = %s", (codigo_postal,))
            deleted = cur.rowcount > 0
        await conn.commit()
    return deleted


# ==================== CEPA ====================
async def list_cepas(page: int = 1, limit: int = 20) -> dict[str, Any]:
    pool = await get_pool()
    offset = (page - 1) * limit
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT COUNT(*) FROM cepa")
            total = (await cur.fetchone())[0]
            await cur.execute(
                "SELECT id_cepa, nombre, tipo FROM cepa ORDER BY id_cepa LIMIT %s OFFSET %s",
                (limit, offset)
            )
            rows = await cur.fetchall()
    return {
        "data": [{"id_cepa": r[0], "nombre": r[1], "tipo": r[2]} for r in rows],
        "total": total,
        "page": page,
        "limit": 20,
    }


async def get_cepa(id_cepa: int) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT id_cepa, nombre, tipo FROM cepa WHERE id_cepa = %s", (id_cepa,))
            row = await cur.fetchone()
    if not row:
        return None
    return {"id_cepa": row[0], "nombre": row[1], "tipo": row[2]}


async def create_cepa(data: dict) -> dict:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT INTO cepa (nombre, tipo) VALUES (%s, %s) RETURNING id_cepa",
                (data["nombre"], data["tipo"])
            )
            new_id = (await cur.fetchone())[0]
        await conn.commit()
    return await get_cepa(new_id)


async def update_cepa(id_cepa: int, data: dict) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            sets = []
            vals = []
            for k, v in data.items():
                sets.append(f"{k} = %s")
                vals.append(v)
            if not sets:
                return await get_cepa(id_cepa)
            vals.append(id_cepa)
            await cur.execute(
                f"UPDATE cepa SET {', '.join(sets)} WHERE id_cepa = %s",
                vals
            )
        await conn.commit()
    return await get_cepa(id_cepa)


async def delete_cepa(id_cepa: int) -> bool:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("DELETE FROM cepa WHERE id_cepa = %s", (id_cepa,))
            deleted = cur.rowcount > 0
        await conn.commit()
    return deleted


# ==================== MARIDAJE ====================
async def list_maridajes(page: int = 1, limit: int = 20) -> dict[str, Any]:
    pool = await get_pool()
    offset = (page - 1) * limit
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT COUNT(*) FROM maridaje")
            total = (await cur.fetchone())[0]
            await cur.execute(
                "SELECT id_maridaje, nombre, temp_servicio FROM maridaje ORDER BY id_maridaje LIMIT %s OFFSET %s",
                (limit, offset)
            )
            rows = await cur.fetchall()
    return {
        "data": [{"id_maridaje": r[0], "nombre": r[1], "temp_servicio": float(r[2])} for r in rows],
        "total": total,
        "page": page,
        "limit": 20,
    }


async def get_maridaje(id_maridaje: int) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT id_maridaje, nombre, temp_servicio FROM maridaje WHERE id_maridaje = %s", (id_maridaje,))
            row = await cur.fetchone()
    if not row:
        return None
    return {"id_maridaje": row[0], "nombre": row[1], "temp_servicio": float(row[2])}


async def create_maridaje(data: dict) -> dict:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT INTO maridaje (nombre, temp_servicio) VALUES (%s, %s) RETURNING id_maridaje",
                (data["nombre"], data["temp_servicio"])
            )
            new_id = (await cur.fetchone())[0]
        await conn.commit()
    return await get_maridaje(new_id)


async def update_maridaje(id_maridaje: int, data: dict) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            sets = []
            vals = []
            for k, v in data.items():
                sets.append(f"{k} = %s")
                vals.append(v)
            if not sets:
                return await get_maridaje(id_maridaje)
            vals.append(id_maridaje)
            await cur.execute(
                f"UPDATE maridaje SET {', '.join(sets)} WHERE id_maridaje = %s",
                vals
            )
        await conn.commit()
    return await get_maridaje(id_maridaje)


async def delete_maridaje(id_maridaje: int) -> bool:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("DELETE FROM maridaje WHERE id_maridaje = %s", (id_maridaje,))
            deleted = cur.rowcount > 0
        await conn.commit()
    return deleted
