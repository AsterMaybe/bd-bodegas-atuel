from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UsuarioLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

class UsuarioCreate(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    rol: str = Field(default="empleado", pattern="^(administrador|empleado)$")

class UsuarioResponse(BaseModel):
    id_usuario: int
    nombre: str
    email: str
    rol: str
    fecha_creacion: str
    activo: bool

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    usuario: UsuarioResponse