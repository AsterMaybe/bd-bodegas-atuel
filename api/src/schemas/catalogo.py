from typing import Optional
from pydantic import BaseModel, Field


# ==================== DEPARTAMENTO ====================
class DepartamentoCreate(BaseModel):
    nombre_depto: str = Field(..., max_length=100)
    provincia: str = Field(..., max_length=50)


class DepartamentoUpdate(BaseModel):
    nombre_depto: Optional[str] = Field(None, max_length=100)
    provincia: Optional[str] = Field(None, max_length=50)


class DepartamentoResponse(BaseModel):
    id_depto: int
    nombre_depto: str
    provincia: str

    class Config:
        from_attributes = True


# ==================== LOCALIDAD ====================
class LocalidadCreate(BaseModel):
    codigo_postal: str = Field(..., max_length=10)
    provincia: str = Field(..., max_length=50)
    nombre: str = Field(..., max_length=100)
    cuit_encargado: str = Field(..., min_length=11, max_length=11, pattern=r'^\d{11}$')


class LocalidadUpdate(BaseModel):
    provincia: Optional[str] = Field(None, max_length=50)
    nombre: Optional[str] = Field(None, max_length=100)
    cuit_encargado: Optional[str] = Field(None, min_length=11, max_length=11, pattern=r'^\d{11}$')


class LocalidadResponse(BaseModel):
    codigo_postal: str
    provincia: str
    nombre: str
    cuit_encargado: str

    class Config:
        from_attributes = True


# ==================== CEPA ====================
class CepaCreate(BaseModel):
    nombre: str = Field(..., max_length=50)
    tipo: str = Field(..., pattern=r"^(tinta|blanca)$")


class CepaUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=50)
    tipo: Optional[str] = Field(None, pattern=r"^(tinta|blanca)$")


class CepaResponse(BaseModel):
    id_cepa: int
    nombre: str
    tipo: str

    class Config:
        from_attributes = True


# ==================== MARIDAJE ====================
class MaridajeCreate(BaseModel):
    nombre: str = Field(..., max_length=100)
    temp_servicio: float = Field(..., gt=0)


class MaridajeUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=100)
    temp_servicio: Optional[float] = Field(None, gt=0)


class MaridajeResponse(BaseModel):
    id_maridaje: int
    nombre: str
    temp_servicio: float

    class Config:
        from_attributes = True