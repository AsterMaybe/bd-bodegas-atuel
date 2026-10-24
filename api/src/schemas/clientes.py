from __future__ import annotations

from datetime import date

from pydantic import BaseModel, Field


class ClienteCreate(BaseModel):
    nombre_razon: str = Field(..., min_length=1, max_length=150)
    tipo_doc: str = Field(..., min_length=1, max_length=10)
    nro_doc: str = Field(..., min_length=1, max_length=20)
    direccion: str | None = Field(default=None, max_length=150)
    codigo_postal: str = Field(..., min_length=1, max_length=10)
    descuento: float = Field(default=0)
    tipo: str = Field(..., pattern=r"^(socio|distribuidor|exportador)$")
    # Campos específicos por subtipo
    zona_cobertura: str | None = None
    nro_habilitacion: str | None = None
    pais_destino: str | None = None


class ClienteUpdate(BaseModel):
    nombre_razon: str | None = Field(default=None, min_length=1, max_length=150)
    tipo_doc: str | None = Field(default=None, min_length=1, max_length=10)
    nro_doc: str | None = Field(default=None, min_length=1, max_length=20)
    direccion: str | None = None
    codigo_postal: str | None = Field(default=None, min_length=1, max_length=10)
    descuento: float | None = None


class ClienteResponse(BaseModel):
    id_cliente: int
    nombre_razon: str
    tipo_doc: str
    nro_doc: str
    direccion: str | None = None
    fecha_alta: date | str
    descuento: float
    codigo_postal: str
    tipo: str | None = None
    # Campos subtipo
    zona_cobertura: str | None = None
    nro_habilitacion: str | None = None
    pais_destino: str | None = None
    permisos: list[dict] | None = None