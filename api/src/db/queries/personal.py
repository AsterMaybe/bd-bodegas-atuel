from __future__ import annotations

from typing import Any
from datetime import date
from decimal import Decimal

from src.db.pool import get_pool


# ==================== PERSONAL ====================
async def list_personal(page: int = 1, limit: int = 20) -> dict[str, Any]:
    pool = await get_pool()
    offset = (page - 1) * limit
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT COUNT(*) FROM personal")
            total = (await cur.fetchone())[0]
            await cur.execute(
                "SELECT cuit, nombre, fecha_ingreso, salario FROM personal ORDER BY cuit LIMIT %s OFFSET %s",
                (limit, offset)
            )
            rows = await cur.fetchall()
    return {
        "data": [{"cuit": r[0], "nombre": r[1], "fecha_ingreso": str(r[2]), "salario": float(r[3])} for r in rows],
        "total": total,
        "page": page,
        "limit": 20,
    }


async def get_personal(cuit: str) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT cuit, nombre, fecha_ingreso, salario FROM personal WHERE cuit = %s",
                (cuit,)
            )
            row = await cur.fetchone()
    if not row:
        return None
    return {"cuit": row[0], "nombre": row[1], "fecha_ingreso": str(row[2]), "salario": float(row[3])}


async def create_personal(data: dict) -> dict:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT INTO personal (cuit, nombre, fecha_ingreso, salario) VALUES (%s, %s, %s, %s) RETURNING cuit",
                (data["cuit"], data["nombre"], data["fecha_ingreso"], data["salario"])
            )
            new_cuit = (await cur.fetchone())[0]
        await conn.commit()
    return await get_personal(new_cuit)


async def update_personal(cuit: str, data: dict) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            sets = []
            vals = []
            for k, v in data.items():
                sets.append(f"{k} = %s")
                vals.append(v)
            if not sets:
                return await get_personal(cuit)
            vals.append(cuit)
            await cur.execute(
                f"UPDATE personal SET {', '.join(sets)} WHERE cuit = %s",
                vals
            )
        await conn.commit()
    return await get_personal(cuit)


async def delete_personal(cuit: str) -> bool:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("DELETE FROM personal WHERE cuit = %s", (cuit,))
            deleted = cur.rowcount > 0
        await conn.commit()
    return deleted


# ==================== ENCARGADO ====================
async def list_encargados(page: int = 1, limit: int = 20) -> dict[str, Any]:
    pool = await get_pool()
    offset = (page - 1) * limit
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT COUNT(*) FROM encargado")
            total = (await cur.fetchone())[0]
            await cur.execute(
                "SELECT e.cuit, p.nombre, p.fecha_ingreso, p.salario FROM encargado e JOIN personal p ON p.cuit = e.cuit ORDER BY e.cuit LIMIT %s OFFSET %s",
                (limit, offset)
            )
            rows = await cur.fetchall()
    return {
        "data": [{"cuit": r[0], "nombre": r[1], "fecha_ingreso": str(r[2]), "salario": float(r[3])} for r in rows],
        "total": total,
        "page": page,
        "limit": 20,
    }


async def get_encargado(cuit: str) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT e.cuit, p.nombre, p.fecha_ingreso, p.salario FROM encargado e JOIN personal p ON p.cuit = e.cuit WHERE e.cuit = %s",
                (cuit,)
            )
            row = await cur.fetchone()
    if not row:
        return None
    return {"cuit": row[0], "nombre": row[1], "fecha_ingreso": str(row[2]), "salario": float(row[3])}


async def create_encargado(data: dict) -> dict:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("INSERT INTO encargado (cuit) VALUES (%s) RETURNING cuit", (data["cuit"],))
            new_cuit = (await cur.fetchone())[0]
        await conn.commit()
    return await get_encargado(new_cuit)


async def delete_encargado(cuit: str) -> bool:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("DELETE FROM encargado WHERE cuit = %s", (cuit,))
            deleted = cur.rowcount > 0
        await conn.commit()
    return deleted


# ==================== EMPLEADO ====================
async def list_empleados(page: int = 1, limit: int = 20) -> dict[str, Any]:
    pool = await get_pool()
    offset = (page - 1) * limit
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT COUNT(*) FROM empleado")
            total = (await cur.fetchone())[0]
            await cur.execute(
                "SELECT e.cuit, p.nombre, p.fecha_ingreso, p.salario, e.id_sala FROM empleado e JOIN personal p ON p.cuit = e.cuit ORDER BY e.cuit LIMIT %s OFFSET %s",
                (limit, offset)
            )
            rows = await cur.fetchall()
    return {
        "data": [{"cuit": r[0], "nombre": r[1], "fecha_ingreso": str(r[2]), "salario": float(r[3]), "id_sala": r[4]} for r in rows],
        "total": total,
        "page": page,
        "limit": 20,
    }


async def get_empleado(cuit: str) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT e.cuit, p.nombre, p.fecha_ingreso, p.salario, e.id_sala FROM empleado e JOIN personal p ON p.cuit = e.cuit WHERE e.cuit = %s",
                (cuit,)
            )
            row = await cur.fetchone()
    if not row:
        return None
    return {"cuit": row[0], "nombre": row[1], "fecha_ingreso": str(row[2]), "salario": float(row[3]), "id_sala": row[4]}


async def create_empleado(data: dict) -> dict:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("INSERT INTO empleado (cuit, id_sala) VALUES (%s, %s) RETURNING cuit", (data["cuit"], data["id_sala"]))
            new_cuit = (await cur.fetchone())[0]
        await conn.commit()
    return await get_empleado(new_cuit)


async def update_empleado(cuit: str, data: dict) -> dict | None:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            sets = []
            vals = []
            for k, v in data.items():
                sets.append(f"{k} = %s")
                vals.append(v)
            if not sets:
                return await get_empleado(cuit)
            vals.append(cuit)
            await cur.execute(
                f"UPDATE empleado SET {', '.join(sets)} WHERE cuit = %s",
                vals
            )
        await conn.commit()
    return await get_empleado(cuit)


async def delete_empleado(cuit: str) -> bool:
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("DELETE FROM empleado WHERE cuit = %s", (cuit,))
            deleted = cur.rowcount > 0
        await conn.commit()
    return deleted
