from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from src.db.queries.finca import (
    create_finca,
    delete_finca,
    get_finca,
    list_fincas,
    update_finca,
)
from src.schemas.finca import FincaCreate, FincaResponse, FincaUpdate

router = APIRouter()


@router.get("", response_model=dict)
async def get_fincas(
    page: int = Query(default=1, ge=1, description="Número de página"),
    limit: int = Query(default=20, ge=1, le=100, description="Registros por página (máx 100)"),
):
    """Lista fincas con paginación."""
    result = await list_fincas(page=page, limit=limit)
    return result


@router.get("/{id_finca}", response_model=FincaResponse)
async def get_finca_endpoint(id_finca: int):
    """Detalle de finca."""
    result = await get_finca(id_finca)
    if result is None:
        raise HTTPException(status_code=404, detail="Finca no encontrada")
    return result


@router.post("", status_code=201, response_model=FincaResponse)
async def post_finca(finca: FincaCreate):
    """Alta de finca."""
    data = finca.model_dump()
    result = await create_finca(data)
    return result


@router.put("/{id_finca}", response_model=FincaResponse)
async def put_finca(id_finca: int, finca: FincaUpdate):
    """Modificación de finca."""
    data = finca.model_dump(exclude_unset=True)
    result = await update_finca(id_finca, data)
    if result is None:
        raise HTTPException(status_code=404, detail="Finca no encontrada")
    return result


@router.delete("/{id_finca}", status_code=204)
async def delete_finca_endpoint(id_finca: int):
    """Baja de finca."""
    deleted = await delete_finca(id_finca)
    if not deleted:
        raise HTTPException(status_code=404, detail="Finca no encontrada")
    return None
