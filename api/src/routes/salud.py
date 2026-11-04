from __future__ import annotations

from fastapi import APIRouter

from src.db.queries.salud import check_health
from src.schemas.common import SaludResponse

router = APIRouter()


@router.get("/salud", response_model=SaludResponse)
async def salud():
    """Verifica que la API llegue a la base de datos."""
    result = await check_health()
    return result


@router.get("/health", response_model=SaludResponse)
async def health():
    """Alias de /salud para compatibilidad con monitores y healthchecks externos."""
    return await salud()