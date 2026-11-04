from __future__ import annotations

from fastapi import APIRouter, HTTPException

from src.db.queries.comprobantes import create_comprobante, get_comprobante_by_id
from src.schemas.comprobantes import ComprobanteCreate, ComprobanteResponse

router = APIRouter()


@router.post("", status_code=201, response_model=ComprobanteResponse)
async def post_comprobante(comprobante: ComprobanteCreate):
    """Venta completa (cabecera + renglones) en una sola transacción."""
    data = comprobante.model_dump()
    result = await create_comprobante(data)
    return result


@router.get("/{nro_comprob}", response_model=ComprobanteResponse)
async def get_comprobante(nro_comprob: int):
    """Detalle de comprobante con renglones."""
    result = await get_comprobante_by_id(nro_comprob)
    if result is None:
        raise HTTPException(status_code=404, detail="Comprobante no encontrado")
    return result