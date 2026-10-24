from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from src.db.queries.reportes import (
    top_vinos,
    trazabilidad,
    transportista_activo,
    ventas_por_sala,
    vinos_sin_stock,
)

router = APIRouter()


@router.get("/top-vinos")
async def get_top_vinos(limit: int = Query(default=10, ge=1, le=50)):
    """S1: Ranking de los 10 vinos más vendidos."""
    result = await top_vinos(limit=limit)
    return {"data": result}


@router.get("/ventas-por-sala")
async def get_ventas_por_sala(
    desde: str | None = Query(default=None),
    hasta: str | None = Query(default=None),
):
    """S8: Monto total de ventas por sala."""
    result = await ventas_por_sala(desde=desde, hasta=hasta)
    return {"data": result}


@router.get("/vinos-sin-stock")
async def get_vinos_sin_stock(id_sala: int = Query(..., gt=0)):
    """S6: Vinos sin stock en sala pero con stock en depósito."""
    result = await vinos_sin_stock(id_sala=id_sala)
    return {"data": result}


@router.get("/transportista-activo")
async def get_transportista_activo(
    desde: str | None = Query(default=None),
    hasta: str | None = Query(default=None),
):
    """S7: Empresa de transporte con mayor actividad."""
    result = await transportista_activo(desde=desde, hasta=hasta)
    return {"data": result}


@router.get("/trazabilidad/{codigo_vino}")
async def get_trazabilidad(codigo_vino: int):
    """S9/S12: Trazabilidad completa de un vino."""
    result = await trazabilidad(codigo_vino=codigo_vino)
    if not result:
        raise HTTPException(status_code=404, detail="Vino no encontrado")
    return result