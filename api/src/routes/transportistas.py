from fastapi import APIRouter, Query, HTTPException
from typing import Optional

from src.schemas.transportistas import TransportistaCreate, TransportistaUpdate, TransportistaResponse
from src.db.queries import transportista as transportista_queries


router = APIRouter(tags=["Transportistas"])


@router.get(
    "",
    response_model=dict,
    summary="Listar transportistas",
    description="Retorna lista paginada de transportistas",
)
async def list_transportistas(
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(20, ge=1, le=100, description="Registros por página"),
):
    return await transportista_queries.list_transportistas(page=page, limit=limit)


@router.get(
    "/{codigo}",
    response_model=TransportistaResponse,
    summary="Obtener transportista por código",
    description="Retorna un transportista por su código",
)
async def get_transportista(codigo: int):
    result = await transportista_queries.get_transportista(codigo)
    if not result:
        raise HTTPException(status_code=404, detail="Transportista no encontrado")
    return result


@router.post(
    "",
    response_model=TransportistaResponse,
    status_code=201,
    summary="Crear transportista",
    description="Crea un nuevo transportista",
)
async def create_transportista(data: TransportistaCreate):
    return await transportista_queries.create_transportista(data.model_dump())


@router.put(
    "/{codigo}",
    response_model=TransportistaResponse,
    summary="Actualizar transportista",
    description="Actualiza un transportista existente",
)
async def update_transportista(codigo: int, data: TransportistaUpdate):
    result = await transportista_queries.update_transportista(codigo, data.model_dump(exclude_unset=True))
    if not result:
        raise HTTPException(status_code=404, detail="Transportista no encontrado")
    return result


@router.delete(
    "/{codigo}",
    status_code=204,
    summary="Eliminar transportista",
    description="Elimina un transportista",
)
async def delete_transportista(codigo: int):
    deleted = await transportista_queries.delete_transportista(codigo)
    if not deleted:
        raise HTTPException(status_code=404, detail="Transportista no encontrado")
    return None