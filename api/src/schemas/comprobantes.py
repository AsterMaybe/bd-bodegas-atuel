from __future__ import annotations

from pydantic import BaseModel, Field


class RenglonComprobanteCreate(BaseModel):
    codigo_vino: int
    cantidad: int


class ComprobanteCreate(BaseModel):
    id_cliente: int
    id_sala: int
    renglones: list[RenglonComprobanteCreate] = Field(..., min_length=1)


class RenglonComprobanteResponse(BaseModel):
    nro_comprob: int
    codigo_vino: int
    cantidad: int
    precio_unitario: float
    descuento: float
    subtotal: float


class ComprobanteResponse(BaseModel):
    nro_comprob: int
    fecha: str
    subtotal: float
    descuento: float
    total: float
    id_cliente: int
    id_sala: int
    renglones: list[RenglonComprobanteResponse] = []