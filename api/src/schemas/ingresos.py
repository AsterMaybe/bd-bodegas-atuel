from __future__ import annotations

from datetime import date

from pydantic import BaseModel, Field


class RenglonIngresoCreate(BaseModel):
    codigo_vino: int
    cantidad: int


class IngresoCreate(BaseModel):
    cuit_bodega: str = Field(..., pattern=r"^[0-9]{11}$")
    codigo_transp: int


class RenglonIngresoResponse(BaseModel):
    id_documento: int
    codigo_vino: int
    cantidad: int


class IngresoResponse(BaseModel):
    id_documento: int
    fecha: date | str
    estado: str
    cuit_bodega: str
    codigo_transp: int
    renglones: list[RenglonIngresoResponse] = []