from fastapi import APIRouter, HTTPException, Depends, Header
from src.db.pool import with_transaction_ro
from src.schemas.usuario import UsuarioLogin, TokenResponse, UsuarioResponse
import bcrypt

router = APIRouter()

def hash_password(password: str) -> str:
    """Genera hash bcrypt de la contraseña."""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, password_hash: str) -> bool:
    """Verifica contraseña contra hash bcrypt."""
    return bcrypt.checkpw(password.encode(), password_hash.encode())

@router.post("/login", response_model=TokenResponse)
async def login(data: UsuarioLogin):
    async def _auth(ctx):
        cur = await ctx.execute(
            "SELECT id_usuario, nombre, email, rol, fecha_creacion, activo, password_hash FROM USUARIO WHERE email = %s AND activo = TRUE",
            (data.email,)
        )
        row = await cur.fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
        
        if not verify_password(data.password, row[6]):
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
        
        return {
            "id_usuario": row[0],
            "nombre": row[1],
            "email": row[2],
            "rol": row[3],
            "fecha_creacion": str(row[4]),
            "activo": row[5]
        }
    
    usuario = await with_transaction_ro(_auth)
    
    return {
        "access_token": f"token-{usuario['id_usuario']}:{usuario['email']}",
        "token_type": "bearer",
        "usuario": usuario
    }

@router.get("/me", response_model=UsuarioResponse)
async def get_current_user(authorization: str = Header(None)):
    """Valida el token y devuelve el usuario actual."""
    if not authorization or not authorization.startswith("Bearer token-"):
        raise HTTPException(status_code=401, detail="Token inválido o ausente")
    
    try:
        payload = authorization.split("token-")[1]
        if ":" not in payload:
            raise ValueError()
        id_usuario_str, email = payload.split(":", 1)
        id_usuario = int(id_usuario_str)
    except (ValueError, IndexError):
        raise HTTPException(status_code=401, detail="Formato de token inválido")
    
    async def _validate(ctx):
        cur = await ctx.execute(
            "SELECT id_usuario, nombre, email, rol, fecha_creacion, activo FROM USUARIO WHERE id_usuario = %s AND email = %s AND activo = TRUE",
            (id_usuario, email)
        )
        row = await cur.fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Usuario no encontrado o inactivo")
        return {
            "id_usuario": row[0],
            "nombre": row[1],
            "email": row[2],
            "rol": row[3],
            "fecha_creacion": str(row[4]),
            "activo": row[5]
        }
    
    return await with_transaction_ro(_validate)