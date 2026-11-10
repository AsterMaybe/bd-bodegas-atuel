import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request

from src.config.settings import get_settings
from src.db.pool import (
    app_current_user,
    close_pool,
    get_pool,
    health_check,
)
from src.errors.handler import global_exception_handler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestión del ciclo de vida: pool de conexiones."""
    # Startup
    await get_pool()
    yield
    # Shutdown
    await close_pool()


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="Bodegas del Atuel - API",
        description="API REST para la gestión de Bodegas del Atuel (Etapa 6)",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/docs/json",
        lifespan=lifespan,
    )

    # CORS (permite front-end)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Handler global de errores
    @app.exception_handler(Exception)
    async def _global_exception_handler(request, exc):
        return await global_exception_handler(request, exc)

    # Registrar rutas
    from src.routes import (
        salud, vinos, clientes, comprobantes, transferencias, ingresos, reportes, finca, activity, salas, bodegas, transportistas, catalogo, auth
    )

    app.include_router(salud.router, prefix="/api", tags=["Salud"])
    app.include_router(vinos.router, prefix="/api/vinos", tags=["Vinos"])
    app.include_router(clientes.router, prefix="/api/clientes", tags=["Clientes"])
    app.include_router(comprobantes.router, prefix="/api/comprobantes", tags=["Comprobantes"])
    app.include_router(transferencias.router, prefix="/api/transferencias", tags=["Transferencias"])
    app.include_router(ingresos.router, prefix="/api/ingresos", tags=["Ingresos"])
    app.include_router(reportes.router, prefix="/api/reportes", tags=["Reportes"])
    app.include_router(finca.router, prefix="/api/fincas/fincas", tags=["Fincas"])
    app.include_router(activity.router, prefix="/api/activity", tags=["Actividad"])
    app.include_router(salas.router, prefix="/api/salas", tags=["Salas de Venta"])
    app.include_router(bodegas.router, prefix="/api/bodegas", tags=["Bodegas"])
    app.include_router(transportistas.router, prefix="/api/transportistas", tags=["Transportistas"])
    app.include_router(catalogo.router, prefix="/api/catalogo", tags=["Catálogo"])
    app.include_router(auth.router, prefix="/auth", tags=["Autenticación"])

    @app.get("/")
    async def root():
        return {"message": "Bodegas del Atuel API", "docs": "/docs"}

    # Healthcheck endpoint para Docker (sin prefijo /api)
    @app.get("/health")
    async def health():
        """Healthcheck simple para Docker."""
        return await health_check()

    # Middleware para propagar el usuario autenticado a los triggers de auditoría
    @app.middleware("http")
    async def set_app_user_middleware(request: Request, call_next):
        """Extrae el usuario autenticado del header Authorization y lo establece
        en el contexto asyncio para que los triggers de auditoría
        puedan registrar quién realizó cada operación.

        El token tiene el formato: token-{id_usuario}:{email}
        Extraemos el email directamente del token sin consultar la BD,
        para evitar que la query de consulta pase por TransactionContext
        antes de que el usuario esté seteado.
        """
        auth = request.headers.get("authorization", "")
        usuario_email = None
        if auth.startswith("Bearer token-"):
            try:
                # Formato: token-{id_usuario}:{email}
                payload = auth.split("token-")[1]
                # El email puede contener '@', así que tomamos todo después del primer ':'
                if ":" in payload:
                    _, usuario_email = payload.split(":", 1)
            except (ValueError, IndexError):
                pass

        token = app_current_user.set(usuario_email) if usuario_email else None
        try:
            response = await call_next(request)
        finally:
            if token is not None:
                app_current_user.reset(token)
        return response

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=(settings.env == "development"),
        log_level=settings.log_level,
    )