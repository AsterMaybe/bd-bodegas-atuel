from __future__ import annotations

from fastapi import APIRouter, HTTPException

from src.db.queries.transferencias import (
    add_renglones_transferencia,
    create_transferencia,
    get_transferencia_by_id,
    procesar_transferencia,
    terminar_transferencia,
)
from src.schemas.transferencias import (
    RenglonTransferenciaCreate,
    TransferenciaCreate,
    TransferenciaResponse,
)

router = APIRouter()


@router.post("", status_code=201)
async def post_transferencia(transferencia: TransferenciaCreate):
    """Alta de transferencia (estado en_confeccion)."""
    data = transferencia.model_dump()
    result = await create_transferencia(data)
    return result


@router.post("/{nro}/renglones", status_code=201)
async def post_renglones_transferencia(nro: int, renglones: list[RenglonTransferenciaCreate]):
    """Carga de renglones mientras está en confección."""
    data = [r.model_dump() for r in renglones]
    result = await add_renglones_transferencia(nro, data)
    if result is None:
        raise HTTPException(status_code=404, detail="Transferencia no encontrada")
    return result


@router.post("/{nro}/terminar")
async def terminar_transferencia_endpoint(nro: int):
    """Cambio de estado a 'terminado'."""
    result = await terminar_transferencia(nro)
    if result is None:
        raise HTTPException(status_code=404, detail="Transferencia no encontrada")
    return result


@router.post("/{nro}/procesar")
async def procesar_transferencia_endpoint(nro: int):
    """Procesa transferencia (invoca procedimiento almacenado)."""
    result = await procesar_transferencia(nro)
    if result is None:
        raise HTTPException(status_code=404, detail="Transferencia no encontrada")
    return result


@router.get("/{nro}")
async def get_transferencia(nro: int):
    """Detalle de transferencia con renglones."""
    result = await get_transferencia_by_id(nro)
    if result is None:
        raise HTTPException(status_code=404, detail="Transferencia no encontrada")
    return result