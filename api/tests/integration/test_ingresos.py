import pytest
from fastapi.testclient import TestClient


def test_create_ingreso(client: TestClient):
    """POST /ingresos crea ingreso en_confeccion."""
    # Obtener un cuit_bodega y codigo_transp válidos
    vinos = client.get("/vinos?page=1&limit=1").json()
    if not vinos["data"]:
        pytest.skip("No hay vinos")
    cuit_bodega = vinos["data"][0]["cuit_bodega"]

    response = client.post("/ingresos", json={
        "cuit_bodega": cuit_bodega,
        "codigo_transp": 1,
    })
    assert response.status_code == 201
    data = response.json()
    assert data["estado"] == "en_confeccion"
    assert "id_documento" in data


def test_procesar_ingreso_no_terminado(client: TestClient):
    """Procesar ingreso en_confeccion (no terminado) retorna 409 (RN-10)."""
    vinos = client.get("/vinos?page=1&limit=1").json()
    if not vinos["data"]:
        pytest.skip("No hay vinos")
    cuit_bodega = vinos["data"][0]["cuit_bodega"]

    resp = client.post("/ingresos", json={
        "cuit_bodega": cuit_bodega,
        "codigo_transp": 1,
    })
    assert resp.status_code == 201
    cod = resp.json()["id_documento"]

    # Procesar directamente sin terminar → debe fallar (RN-10)
    response = client.post(f"/ingresos/{cod}/procesar")
    assert response.status_code == 409


def test_get_ingreso_no_existe(client: TestClient):
    """GET /ingresos/{cod} con código inexistente retorna 404."""
    response = client.get("/ingresos/999999")
    assert response.status_code == 404