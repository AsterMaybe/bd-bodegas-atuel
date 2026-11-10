from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from src.db.queries.transferencias import (
    add_renglones_transferencia,
    create_transferencia,
    get_transferencia_by_id,
    list_transferencias,
    procesar_transferencia,
    terminar_transferencia,
)
from src.schemas.transferencias import (
    RenglonTransferenciaCreate,
    TransferenciaCreate,
    TransferenciaResponse,
)

router = APIRouter()


@router.post("", status_code=201, response_model=TransferenciaResponse)
async def post_transferencia(transferencia: TransferenciaCreate):
    """Alta de transferencia (estado en_confeccion)."""
    data = transferencia.model_dump()
    result = await create_transferencia(data)
    return result


@router.post("/{nro}/renglones", status_code=201, response_model=TransferenciaResponse)
async def post_renglones_transferencia(nro: int, renglones: list[RenglonTransferenciaCreate]):
    """Carga de renglones mientras está en confección."""
    data = [r.model_dump() for r in renglones]
    result = await add_renglones_transferencia(nro, data)
    if result is None:
        raise HTTPException(status_code=404, detail="Transferencia no encontrada")
    return result


@router.post("/{nro}/terminar", response_model=TransferenciaResponse)
async def terminar_transferencia_endpoint(nro: int):
    """Cambio de estado a 'terminado'."""
    result = await terminar_transferencia(nro)
    if result is None:
        raise HTTPException(status_code=404, detail="Transferencia no encontrada")
    return result


@router.post("/{nro}/procesar", response_model=TransferenciaResponse)
async def procesar_transferencia_endpoint(nro: int):
    """Procesa transferencia (invoca procedimiento almacenado)."""
    result = await procesar_transferencia(nro)
    if result is None:
        raise HTTPException(status_code=404, detail="Transferencia no encontrada")
    return result


@router.get("", response_model=dict)
async def get_transferencias(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    estado: str | None = Query(default=None, description="Filtrar por estado: en_confeccion, terminado, procesado"),
    search: str | None = Query(default=None, description="Buscar por Nº transferencia o sala"),
):
    """Lista transferencias con paginación, filtro por estado y búsqueda."""
    return await list_transferencias(page=page, limit=limit, estado=estado, search=search)


@router.get("/{nro}", response_model=TransferenciaResponse)
async def get_transferencia(nro: int):
    """Detalle de transferencia con renglones."""
    result = await get_transferencia_by_id(nro)
    if result is None:
        raise HTTPException(status_code=404, detail="Transferencia no encontrada")
    return result