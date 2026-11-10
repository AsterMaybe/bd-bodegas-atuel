from typing import Optional
from pydantic import BaseModel, Field


class BodegaCreate(BaseModel):
    cuit: str = Field(..., min_length=11, max_length=11, pattern=r'^\d{11}$')
    razon_social: str = Field(..., max_length=100)
    domicilio: str = Field(..., max_length=150)


class BodegaUpdate(BaseModel):
    razon_social: Optional[str] = Field(None, max_length=100)
    domicilio: Optional[str] = Field(None, max_length=150)


class BodegaResponse(BaseModel):
    cuit: str
    razon_social: str
    domicilio: str

    class Config:
        from_attributes = True