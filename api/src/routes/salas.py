from fastapi import APIRouter, Query, HTTPException
from typing import Optional

from src.schemas.salas import SalaCreate, SalaUpdate, SalaResponse
from src.db.queries import sala_venta as sala_queries


router = APIRouter(tags=["Salas de Venta"])


@router.get(
    "",
    response_model=dict,
    summary="Listar salas de venta",
    description="Retorna lista paginada de salas de venta",
)
async def list_salas(
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(20, ge=1, le=100, description="Registros por página"),
):
    return await sala_queries.list_salas(page=page, limit=limit)


@router.get(
    "/{id_sala}",
    response_model=SalaResponse,
    summary="Obtener sala por ID",
    description="Retorna una sala de venta por su ID",
)
async def get_sala(id_sala: int):
    result = await sala_queries.get_sala(id_sala)
    if not result:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    return result


@router.post(
    "",
    response_model=SalaResponse,
    status_code=201,
    summary="Crear sala de venta",
    description="Crea una nueva sala de venta",
)
async def create_sala(data: SalaCreate):
    return await sala_queries.create_sala(data.model_dump())


@router.put(
    "/{id_sala}",
    response_model=SalaResponse,
    summary="Actualizar sala de venta",
    description="Actualiza una sala de venta existente",
)
async def update_sala(id_sala: int, data: SalaUpdate):
    result = await sala_queries.update_sala(id_sala, data.model_dump(exclude_unset=True))
    if not result:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    return result


@router.delete(
    "/{id_sala}",
    status_code=204,
    summary="Eliminar sala de venta",
    description="Elimina una sala de venta",
)
async def delete_sala(id_sala: int):
    deleted = await sala_queries.delete_sala(id_sala)
    if not deleted:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    return None