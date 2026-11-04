import psycopg
from psycopg_pool import AsyncConnectionPool
from src.config.settings import get_settings

_pool: AsyncConnectionPool | None = None


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

    async def execute(self, query: str, params: tuple | list | dict | None = None):
        return await self._conn.execute(query, params)

    async def fetchone(self, query: str, params: tuple | list | dict | None = None):
        cur = await self._conn.execute(query, params)
        return await cur.fetchone()

    async def fetchall(self, query: str, params: tuple | list | dict | None = None):
        cur = await self._conn.execute(query, params)
        return await cur.fetchall()

    async def fetchmany(self, query: str, params: tuple | list | dict | None = None, size: int = 100):
        cur = await self._conn.execute(query, params)
        return await cur.fetchmany(size)

    @property
    def raw(self) -> psycopg.AsyncConnection:
        return self._conn


async def with_transaction(fn):
    """Ejecuta fn dentro de una transacción (BEGIN/COMMIT/ROLLBACK)."""
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.transaction():
            ctx = TransactionContext(conn)
            return await fn(ctx)


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