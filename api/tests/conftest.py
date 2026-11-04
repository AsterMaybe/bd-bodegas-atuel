import asyncio
import os
import sys

# Usar SelectorEventLoop en Windows para compatibilidad con psycopg async
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import pytest
from fastapi.testclient import TestClient

# Añadir src al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@pytest.fixture(scope="session")
def app():
    from src.main import create_app

    return create_app()


@pytest.fixture(scope="session")
def client(app):
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c