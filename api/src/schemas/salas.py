from typing import Optional
from pydantic import BaseModel, Field


class SalaCreate(BaseModel):
    numero: int = Field(..., description="Número de la calle")
    calle: str = Field(..., max_length=100, description="Nombre de la calle")
    dia_de_cierre: Optional[int] = Field(None, ge=1, le=7, description="Día de cierre (1=Lunes, 7=Domingo)")
    codigo_postal: str = Field(..., max_length=10, description="Código postal de la localidad")


class SalaUpdate(BaseModel):
    numero: Optional[int] = None
    calle: Optional[str] = Field(None, max_length=100)
    dia_de_cierre: Optional[int] = Field(None, ge=1, le=7)
    codigo_postal: Optional[str] = Field(None, max_length=10)


class SalaResponse(BaseModel):
    id_sala: int
    numero: int
    calle: str
    dia_de_cierre: Optional[int] = None
    codigo_postal: str

    class Config:
        from_attributes = True


class SalaListParams(BaseModel):
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)