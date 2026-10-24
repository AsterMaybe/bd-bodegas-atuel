from __future__ import annotations

from fastapi import APIRouter, HTTPException

from src.db.queries.ingresos import (
    add_renglones_ingreso,
    create_ingreso,
    get_ingreso_by_id,
    procesar_ingreso,
)
from src.schemas.ingresos import (
    IngresoCreate,
    RenglonIngresoCreate,
)

router = APIRouter()


@router.post("", status_code=201)
async def post_ingreso(ingreso: IngresoCreate):
    """Alta de ingreso (estado en_confeccion)."""
    data = ingreso.model_dump()
    result = await create_ingreso(data)
    return result


@router.post("/{cod}/renglones", status_code=201)
async def post_renglones_ingreso(cod: int, renglones: list[RenglonIngresoCreate]):
    """Carga de renglones mientras está en confección."""
    data = [r.model_dump() for r in renglones]
    result = await add_renglones_ingreso(cod, data)
    if result is None:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    return result


@router.post("/{cod}/procesar")
async def procesar_ingreso_endpoint(cod: int):
    """Procesa ingreso (invoca procedimiento almacenado)."""
    result = await procesar_ingreso(cod)
    if result is None:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    return result


@router.get("/{cod}")
async def get_ingreso(cod: int):
    """Detalle de ingreso con renglones."""
    result = await get_ingreso_by_id(cod)
    if result is None:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    return result