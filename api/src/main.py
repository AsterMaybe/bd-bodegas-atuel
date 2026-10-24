import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config.settings import get_settings
from src.db.pool import close_pool, get_pool, health_check
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
    from src.routes import salud, vinos, clientes, comprobantes, transferencias, ingresos, reportes

    app.include_router(salud.router, tags=["Salud"])
    app.include_router(vinos.router, prefix="/vinos", tags=["Vinos"])
    app.include_router(clientes.router, prefix="/clientes", tags=["Clientes"])
    app.include_router(comprobantes.router, prefix="/comprobantes", tags=["Comprobantes"])
    app.include_router(transferencias.router, prefix="/transferencias", tags=["Transferencias"])
    app.include_router(ingresos.router, prefix="/ingresos", tags=["Ingresos"])
    app.include_router(reportes.router, prefix="/reportes", tags=["Reportes"])

    @app.get("/")
    async def root():
        return {"message": "Bodegas del Atuel API", "docs": "/docs"}

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