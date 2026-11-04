import pytest
from fastapi.testclient import TestClient


def test_top_vinos(client: TestClient):
    """GET /reportes/top-vinos retorna ranking."""
    response = client.get("/reportes/top-vinos?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert len(data["data"]) <= 5


def test_ventas_por_sala(client: TestClient):
    """GET /reportes/ventas-por-sala retorna datos."""
    response = client.get("/reportes/ventas-por-sala")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data


def test_vinos_sin_stock(client: TestClient):
    """GET /reportes/vinos-sin-stock?id_sala=1 retorna vinos sin stock."""
    response = client.get("/reportes/vinos-sin-stock?id_sala=1")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data


def test_transportista_activo(client: TestClient):
    """GET /reportes/transportista-activo retorna transportista."""
    response = client.get("/reportes/transportista-activo")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data


def test_trazabilidad(client: TestClient):
    """GET /reportes/trazabilidad/{cod} retorna trazabilidad."""
    vinos = client.get("/vinos?page=1&limit=1").json()
    if not vinos["data"]:
        pytest.skip("No hay vinos")
    cod = vinos["data"][0]["codigo_vino"]
    response = client.get(f"/reportes/trazabilidad/{cod}")
    assert response.status_code == 200
    data = response.json()
    assert "codigo_vino" in data
    assert "composicion" in data
    assert "maridajes" in data