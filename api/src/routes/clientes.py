from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from src.db.queries.clientes import (
    create_cliente,
    delete_cliente,
    get_cliente_by_id,
    list_clientes,
    update_cliente,
)
from src.schemas.clientes import ClienteCreate, ClienteResponse, ClienteUpdate

router = APIRouter()


@router.get("", response_model=dict)
async def get_clientes(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
):
    """Lista clientes con paginación."""
    result = await list_clientes(page=page, limit=limit)
    return result


@router.get("/{id_cliente}", response_model=ClienteResponse)
async def get_cliente(id_cliente: int):
    """Detalle de cliente con datos de subtipo."""
    result = await get_cliente_by_id(id_cliente)
    if result is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return result


@router.post("", status_code=201, response_model=ClienteResponse)
async def post_cliente(cliente: ClienteCreate):
    """Alta de cliente con subtipo (socio/distribuidor/exportador)."""
    data = cliente.model_dump()
    result = await create_cliente(data)
    return result


@router.put("/{id_cliente}", response_model=ClienteResponse)
async def put_cliente(id_cliente: int, cliente: ClienteUpdate):
    """Modificación de cliente."""
    data = cliente.model_dump(exclude_unset=True)
    result = await update_cliente(id_cliente, data)
    if result is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return result


@router.delete("/{id_cliente}", status_code=204)
async def delete_cliente_endpoint(id_cliente: int):
    """Baja de cliente."""
    deleted = await delete_cliente(id_cliente)
    if not deleted:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return None