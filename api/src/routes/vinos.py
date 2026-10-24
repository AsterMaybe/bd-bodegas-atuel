from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query

from src.db.queries.vinos import (
    create_vino,
    delete_vino,
    get_vino_by_id,
    list_vinos,
    update_vino,
)
from src.schemas.common import PaginatedResponse
from src.schemas.vinos import VinoCreate, VinoResponse, VinoUpdate

router = APIRouter()


@router.get("")
async def get_vinos(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    tipo: str | None = Query(default=None),
    cepa: int | None = Query(default=None),
    bodega: str | None = Query(default=None),
    aniada: int | None = Query(default=None),
):
    """Catálogo de vinos con filtros y paginación."""
    result = await list_vinos(
        tipo=tipo, cepa=cepa, bodega=bodega, aniada=aniada,
        page=page, limit=limit,
    )
    return result


@router.get("/{codigo_vino}")
async def get_vino(codigo_vino: int):
    """Detalle de vino con composición y maridajes."""
    result = await get_vino_by_id(codigo_vino)
    if result is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Vino no encontrado")
    return result


@router.post("", status_code=201)
async def post_vino(vino: VinoCreate):
    """Alta de vino con composición de cepas."""
    data = vino.model_dump()
    result = await create_vino(data)
    return result


@router.put("/{codigo_vino}")
async def put_vino(codigo_vino: int, vino: VinoUpdate):
    """Modificación de vino (audita precio si cambia)."""
    data = vino.model_dump(exclude_unset=True)
    result = await update_vino(codigo_vino, data)
    if result is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Vino no encontrado")
    return result


@router.delete("/{codigo_vino}", status_code=204)
async def delete_vino_endpoint(codigo_vino: int):
    """Baja de vino."""
    deleted = await delete_vino(codigo_vino)
    if not deleted:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Vino no encontrado")
    return None