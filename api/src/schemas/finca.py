from __future__ import annotations

from pydantic import BaseModel, Field


class FincaCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=150)
    superficie_ha: float = Field(..., gt=0)
    id_depto: int = Field(..., gt=0)


class FincaUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=150)
    superficie_ha: float | None = Field(default=None, gt=0)
    id_depto: int | None = Field(default=None, gt=0)


class FincaResponse(BaseModel):
    id_finca: int
    nombre: str
    superficie_ha: float
    id_depto: int
