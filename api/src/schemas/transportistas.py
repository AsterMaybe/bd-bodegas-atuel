from typing import Optional
from pydantic import BaseModel, Field


class TransportistaCreate(BaseModel):
    razon_social: str = Field(..., max_length=100)
    cuit: str = Field(..., min_length=11, max_length=11, pattern=r'^\d{11}$')
    email: Optional[str] = Field(None, max_length=100)
    telefono: Optional[str] = Field(None, max_length=20)
    domicilio: Optional[str] = Field(None, max_length=150)


class TransportistaUpdate(BaseModel):
    razon_social: Optional[str] = Field(None, max_length=100)
    cuit: Optional[str] = Field(None, min_length=11, max_length=11, pattern=r'^\d{11}$')
    email: Optional[str] = Field(None, max_length=100)
    telefono: Optional[str] = Field(None, max_length=20)
    domicilio: Optional[str] = Field(None, max_length=150)


class TransportistaResponse(BaseModel):
    codigo: int
    razon_social: str
    cuit: str
    email: Optional[str] = None
    telefono: Optional[str] = None
    domicilio: Optional[str] = None

    class Config:
        from_attributes = True