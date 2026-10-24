from __future__ import annotations

from src.db.pool import get_pool


async def check_health() -> dict[str, str]:
    """Verifica que la BD responda. Lanza excepción si no."""
    pool = await get_pool()
    async with pool.connection() as conn:
        await conn.execute("SELECT 1")
    return {"status": "ok", "db": "connected"}