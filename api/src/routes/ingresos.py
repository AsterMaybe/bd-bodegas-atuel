from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from src.db.queries.ingresos import (
    add_renglones_ingreso,
    create_ingreso,
    get_ingreso_by_id,
    list_ingresos,
    procesar_ingreso,
    terminar_ingreso,
)
from src.schemas.ingresos import (
    IngresoCreate,
    IngresoResponse,
    RenglonIngresoCreate,
)

router = APIRouter()


@router.post("", status_code=201, response_model=IngresoResponse)
async def post_ingreso(ingreso: IngresoCreate):
    """Alta de ingreso (estado en_confeccion)."""
    data = ingreso.model_dump()
    result = await create_ingreso(data)
    return result


@router.post("/{cod}/renglones", status_code=201, response_model=IngresoResponse)
async def post_renglones_ingreso(cod: int, renglones: list[RenglonIngresoCreate]):
    """Carga de renglones mientras está en confección."""
    data = [r.model_dump() for r in renglones]
    result = await add_renglones_ingreso(cod, data)
    if result is None:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    return result


@router.post("/{cod}/procesar", response_model=IngresoResponse)
async def procesar_ingreso_endpoint(cod: int):
    """Procesa ingreso (invoca procedimiento almacenado)."""
    result = await procesar_ingreso(cod)
    if result is None:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    return result


@router.post("/{cod}/terminar", response_model=IngresoResponse)
async def terminar_ingreso_endpoint(cod: int):
    """Cambia estado a 'terminado' (requiere tener renglones)."""
    try:
        result = await terminar_ingreso(cod)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if result is None:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    return result


@router.get("", response_model=dict)
async def get_ingresos(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    estado: str | None = Query(default=None, description="Filtrar por estado: en_confeccion, terminado, procesado"),
    search: str | None = Query(default=None, description="Buscar por Nº ingreso, bodega o transportista"),
):
    """Lista ingresos con paginación, filtro por estado y búsqueda."""
    return await list_ingresos(page=page, limit=limit, estado=estado, search=search)


@router.get("/{cod}", response_model=IngresoResponse)
async def get_ingreso(cod: int):
    """Detalle de ingreso con renglones."""
    result = await get_ingreso_by_id(cod)
    if result is None:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    return result