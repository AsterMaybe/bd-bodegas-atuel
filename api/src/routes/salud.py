from __future__ import annotations

from fastapi import APIRouter

from src.db.queries.salud import check_health

router = APIRouter()


@router.get("/salud")
async def salud():
    """Verifica que la API llegue a la base de datos."""
    result = await check_health()
    return result


@router.get("/health")
async def health():
    """Alias de /salud para compatibilidad con monitores y healthchecks externos."""
    return await salud()