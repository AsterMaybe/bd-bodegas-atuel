import contextvars
import psycopg
from psycopg_pool import AsyncConnectionPool
from src.config.settings import get_settings

_pool: AsyncConnectionPool | None = None

# Context variable para almacenar el usuario autenticado de la aplicación
# durante el ciclo de vida de un request HTTP.
app_current_user: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "app_current_user", default=None
)


async def get_pool() -> AsyncConnectionPool:
    """Obtiene o crea el pool de conexiones singleton."""
    global _pool
    if _pool is None:
        settings = get_settings()
        _pool = AsyncConnectionPool(
            conninfo=settings.database_url,
            min_size=settings.db_pool_min,
            max_size=settings.db_pool_max,
            timeout=settings.db_connection_timeout / 1000.0,
            open=False,
        )
        await _pool.open()
    return _pool


async def health_check() -> bool:
    """Verifica que la BD responda."""
    try:
        pool = await get_pool()
        async with pool.connection() as conn:
            await conn.execute("SELECT 1")
            return True
    except Exception:
        return False


async def close_pool() -> None:
    """Cierra el pool de conexiones."""
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


class TransactionContext:
    """Contexto de transacción que envuelve una conexión."""

    def __init__(self, conn: psycopg.AsyncConnection):
        self._conn = conn

    async def _set_app_user(self) -> None:
        """Establece app.current_user a nivel de sesión para los triggers de auditoría.

        Se usa SET (no SET LOCAL) porque SET LOCAL se revierte al final de cada
        transacción implícita (una por query en psycopg), y el trigger se ejecuta
        en la query siguiente que no vería el valor.
        """
        usuario_app = app_current_user.get()
        if usuario_app:
            await self._conn.execute(
                "SELECT set_config('app.current_user', %s, false)", (usuario_app,)
            )

    async def execute(self, query: str, params: tuple | list | dict | None = None):
        await self._set_app_user()
        return await self._conn.execute(query, params)

    async def fetchone(self, query: str, params: tuple | list | dict | None = None):
        await self._set_app_user()
        cur = await self._conn.execute(query, params)
        return await cur.fetchone()

    async def fetchall(self, query: str, params: tuple | list | dict | None = None):
        await self._set_app_user()
        cur = await self._conn.execute(query, params)
        return await cur.fetchall()

    async def fetchmany(self, query: str, params: tuple | list | dict | None = None, size: int = 100):
        await self._set_app_user()
        cur = await self._conn.execute(query, params)
        return await cur.fetchmany(size)

    @property
    def raw(self) -> psycopg.AsyncConnection:
        return self._conn


async def with_transaction(fn):
    """Ejecuta fn dentro de una transacción (BEGIN/COMMIT/ROLLBACK).

    Si hay un usuario de aplicación establecido en el contexto (app_current_user),
    se ejecuta SET app.current_user al iniciar la transacción para que los
    triggers de auditoría puedan registrar quién realizó la operación. Al final
    se resetea para evitar fugas entre requests que reutilicen la conexión del pool.
    """
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.transaction():
            usuario_app = app_current_user.get()
            if usuario_app:
                await conn.execute(
                    "SELECT set_config('app.current_user', %s, false)", (usuario_app,)
                )
            ctx = TransactionContext(conn)
            try:
                return await fn(ctx)
            finally:
                if usuario_app:
                    await conn.execute("SELECT set_config('app.current_user', '', false)")


async def with_transaction_ro(fn):
    """Ejecuta fn dentro de una transacción de solo lectura."""
    pool = await get_pool()
    async with pool.connection() as conn:
        await conn.execute("BEGIN READ ONLY")
        try:
            ctx = TransactionContext(conn)
            result = await fn(ctx)
            await conn.execute("COMMIT")
            return result
        except Exception:
            await conn.execute("ROLLBACK")
            raise