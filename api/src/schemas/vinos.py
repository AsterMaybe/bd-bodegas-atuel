from __future__ import annotations

from pydantic import BaseModel, Field


class ComposicionItem(BaseModel):
    id_cepa: int
    porcentaje: float


class VinoCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    tipo: str
    aniada: int
    volumen_ml: int
    graduacion: float
    precio: float
    cuit_bodega: str = Field(..., pattern=r"^[0-9]{11}$")
    composicion: list[ComposicionItem] = Field(..., min_length=1)


class VinoUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=100)
    tipo: str | None = None
    aniada: int | None = None
    volumen_ml: int | None = None
    graduacion: float | None = None
    precio: float | None = None
    cuit_bodega: str | None = Field(default=None, pattern=r"^[0-9]{11}$")


class VinoResponse(BaseModel):
    codigo_vino: int
    nombre: str
    tipo: str
    aniada: int
    volumen_ml: int
    graduacion: float
    precio: float
    cuit_bodega: str
    bodega_elaboradora: str | None = None
    composicion: list[dict] | None = None
    maridajes: list[dict] | None = None
    stock_deposito: int | None = None
    stock_total_salas: int | None = None
    stock_global: int | None = None