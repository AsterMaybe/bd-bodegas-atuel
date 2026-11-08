from fastapi import APIRouter, Query, HTTPException
from typing import Optional

from src.schemas.bodegas import BodegaCreate, BodegaUpdate, BodegaResponse
from src.db.queries import bodega as bodega_queries


router = APIRouter(tags=["Bodegas"])


@router.get(
    "",
    response_model=dict,
    summary="Listar bodegas",
    description="Retorna lista paginada de bodegas",
)
async def list_bodegas(
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(20, ge=1, le=100, description="Registros por página"),
):
    return await bodega_queries.list_bodegas(page=page, limit=limit)


@router.get(
    "/{cuit}",
    response_model=BodegaResponse,
    summary="Obtener bodega por CUIT",
    description="Retorna una bodega por su CUIT",
)
async def get_bodega(cuit: str):
    result = await bodega_queries.get_bodega(cuit)
    if not result:
        raise HTTPException(status_code=404, detail="Bodega no encontrada")
    return result


@router.post(
    "",
    response_model=BodegaResponse,
    status_code=201,
    summary="Crear bodega",
    description="Crea una nueva bodega",
)
async def create_bodega(data: BodegaCreate):
    return await bodega_queries.create_bodega(data.model_dump())


@router.put(
    "/{cuit}",
    response_model=BodegaResponse,
    summary="Actualizar bodega",
    description="Actualiza una bodega existente",
)
async def update_bodega(cuit: str, data: BodegaUpdate):
    result = await bodega_queries.update_bodega(cuit, data.model_dump(exclude_unset=True))
    if not result:
        raise HTTPException(status_code=404, detail="Bodega no encontrada")
    return result


@router.delete(
    "/{cuit}",
    status_code=204,
    summary="Eliminar bodega",
    description="Elimina una bodega",
)
async def delete_bodega(cuit: str):
    deleted = await bodega_queries.delete_bodega(cuit)
    if not deleted:
        raise HTTPException(status_code=404, detail="Bodega no encontrada")
    return None