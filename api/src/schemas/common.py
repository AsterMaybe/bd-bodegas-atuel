from __future__ import annotations

from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field, field_validator

T = TypeVar("T")


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)


class PaginatedResponse(BaseModel, Generic[T]):
    data: list[T]
    total: int
    page: int
    limit: int


class VinosFilter(BaseModel):
    tipo: str | None = None
    cepa: int | None = None
    bodega: str | None = None  # CUIT
    aniada: int | None = None

    @field_validator("tipo")
    @classmethod
    def validate_tipo(cls, v: str | None) -> str | None:
        if v is None:
            return v
        valid = {"tinto", "blanco", "rosado", "espumante"}
        if v not in valid:
            raise ValueError(f"tipo debe ser uno de {valid}")
        return v


class DateRangeParams(BaseModel):
    desde: str | None = None
    hasta: str | None = None