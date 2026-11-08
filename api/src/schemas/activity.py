from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class ActividadResponse(BaseModel):
    id_auditoria: int
    tabla_afectada: str
    operacion: str
    id_registro: str
    datos_anteriores: Optional[dict] = None
    datos_nuevos: Optional[dict] = None
    usuario: str
    fecha_hora: datetime
    descripcion: str

    class Config:
        from_attributes = True


class ActividadListParams(BaseModel):
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)
    tabla: Optional[str] = None
    operacion: Optional[str] = None
    usuario: Optional[str] = None
    desde: Optional[date] = None
    hasta: Optional[date] = None
    search: Optional[str] = None