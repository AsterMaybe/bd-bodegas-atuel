from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from datetime import date

from src.schemas.activity import ActividadResponse
from src.db.queries import activity as activity_queries


router = APIRouter(tags=["Actividad"])


@router.get(
    "",
    response_model=dict,
    summary="Listar registro de actividad",
    description="Retorna el historial de auditoría con filtros y paginación",
)
async def list_actividad(
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(20, ge=1, le=100, description="Registros por página"),
    tabla: Optional[str] = Query(None, description="Filtrar por tabla (ej: VINO, CLIENTE)"),
    operacion: Optional[str] = Query(None, description="Filtrar por operación (INSERT, UPDATE, DELETE)"),
    usuario: Optional[str] = Query(None, description="Filtrar por usuario (búsqueda parcial)"),
    desde: Optional[date] = Query(None, description="Fecha desde (inclusive)"),
    hasta: Optional[date] = Query(None, description="Fecha hasta (inclusive)"),
    search: Optional[str] = Query(None, description="Buscar en descripción"),
):
    return await activity_queries.list_actividad(
        page=page,
        limit=limit,
        tabla=tabla,
        operacion=operacion,
        usuario=usuario,
        desde=desde,
        hasta=hasta,
        search=search,
    )


@router.get(
    "/{id_auditoria}",
    response_model=ActividadResponse,
    summary="Obtener detalle de actividad",
    description="Retorna un registro de auditoría por su ID",
)
async def get_actividad(id_auditoria: int):
    result = await activity_queries.get_actividad_by_id(id_auditoria)
    if not result:
        raise HTTPException(status_code=404, detail="Registro de actividad no encontrado")
    return result