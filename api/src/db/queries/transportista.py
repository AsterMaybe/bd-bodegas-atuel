from __future__ import annotations

from typing import Any

from src.db.pool import get_pool


async def list_transportistas(page: int = 1, limit: int = 20) -> dict[str, Any]:
    pool = await get_pool()
    offset = (page - 1) * limit
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT COUNT(*) FROM transportista")
            total = (await cur.fetchone())[0]
            await cur.execute(
                "SELECT codigo, razon_social, cuit, email, telefono, domicilio FROM transportista ORDER BY codigo LIMIT %s OFFSET %s",
                (limit, offset)
            )
            rows = await cur.fetchall()
    return {
        "data": [{"codigo": r[0], "razon_social": r[1], "cuit": r[2], "email": r[3], "telefono": r[4], "domicilio": r[5]} for r in rows],
        "total": total,
        "page": page,
        "limit": 20,
    }


async def get_transportista(codigo: int) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT codigo, razon_social, cuit, email, telefono, domicilio FROM transportista WHERE codigo = %s",
                (codigo,)
            )
            row = await cur.fetchone()
    if not row:
        return None
    return {"codigo": row[0], "razon_social": row[1], "cuit": row[2], "email": row[3], "telefono": row[4], "domicilio": row[5]}


async def create_transportista(data: dict) -> dict:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT INTO transportista (razon_social, cuit, email, telefono, domicilio) VALUES (%s, %s, %s, %s, %s) RETURNING codigo",
                (data["razon_social"], data["cuit"], data.get("email"), data.get("telefono"), data.get("domicilio"))
            )
            new_id = (await cur.fetchone())[0]
        await conn.commit()
    return await get_transportista(new_id)


async def update_transportista(codigo: int, data: dict) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            sets = []
            vals = []
            for k, v in data.items():
                sets.append(f"{k} = %s")
                vals.append(v)
            if not sets:
                return await get_transportista(codigo)
            vals.append(codigo)
            await cur.execute(
                f"UPDATE transportista SET {', '.join(sets)} WHERE codigo = %s",
                vals
            )
        await conn.commit()
    return await get_transportista(codigo)


async def delete_transportista(codigo: int) -> bool:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("DELETE FROM transportista WHERE codigo = %s", (codigo,))
            deleted = cur.rowcount > 0
        await conn.commit()
    return deleted


# ==================== TRANSPORTISTA_LOCALIDAD ====================
async def list_transportista_localidades(page: int = 1, limit: int = 20) -> dict[str, Any]:
    pool = await get_pool()
    offset = (page - 1) * limit
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT COUNT(*) FROM transportista_localidad")
            total = (await cur.fetchone())[0]
            await cur.execute(
                "SELECT codigo_transp, codigo_postal FROM transportista_localidad ORDER BY codigo_transp LIMIT %s OFFSET %s",
                (limit, offset)
            )
            rows = await cur.fetchall()
    return {
        "data": [{"codigo_transp": r[0], "codigo_postal": r[1]} for r in rows],
        "total": total,
        "page": page,
        "limit": 20,
    }


async def create_transportista_localidad(data: dict) -> dict:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT INTO transportista_localidad (codigo_transp, codigo_postal) VALUES (%s, %s)",
                (data["codigo_transp"], data["codigo_postal"])
            )
        await conn.commit()
    return data


async def delete_transportista_localidad(codigo_transp: int, codigo_postal: str) -> bool:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "DELETE FROM transportista_localidad WHERE codigo_transp = %s AND codigo_postal = %s",
                (codigo_transp, codigo_postal)
            )
            deleted = cur.rowcount > 0
        await conn.commit()
    return deleted
