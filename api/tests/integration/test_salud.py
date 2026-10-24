import pytest
from fastapi.testclient import TestClient


def test_salud_ok(client: TestClient):
    """GET /salud retorna 200 con status ok."""
    response = client.get("/salud")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["db"] == "connected"


def test_health_alias(client: TestClient):
    """GET /health es alias de /salud."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["db"] == "connected"