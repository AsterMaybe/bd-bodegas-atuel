from __future__ import annotations

from pydantic import BaseModel, Field


class RenglonTransferenciaCreate(BaseModel):
    codigo_vino: int
    cantidad: int


class TransferenciaCreate(BaseModel):
    id_sala: int


class RenglonTransferenciaResponse(BaseModel):
    id_documento: int
    codigo_vino: int
    cantidad: int


class TransferenciaResponse(BaseModel):
    id_documento: int
    fecha: str
    estado: str
    id_sala: int
    renglones: list[RenglonTransferenciaResponse] = []