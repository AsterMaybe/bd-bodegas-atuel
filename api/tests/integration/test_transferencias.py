import pytest
from fastapi.testclient import TestClient


def test_create_transferencia(client: TestClient):
    """POST /transferencias crea transferencia en_confeccion."""
    response = client.post("/transferencias", json={"id_sala": 1})
    assert response.status_code == 201
    data = response.json()
    assert data["estado"] == "en_confeccion"
    assert "id_documento" in data


def test_renglones_en_estado_no_confeccion(client: TestClient):
    """Agregar renglones a transferencia no en_confeccion retorna 409 (RN-12)."""
    # Crear transferencia
    resp = client.post("/transferencias", json={"id_sala": 1})
    assert resp.status_code == 201
    nro = resp.json()["id_documento"]

    # Terminarla
    term = client.post(f"/transferencias/{nro}/terminar")
    assert term.status_code == 200

    # Intentar agregar renglones → debe fallar (RN-12)
    vinos = client.get("/vinos?page=1&limit=1").json()
    if not vinos["data"]:
        pytest.skip("No hay vinos")
    cod = vinos["data"][0]["codigo_vino"]
    response = client.post(f"/transferencias/{nro}/renglones", json=[{"codigo_vino": cod, "cantidad": 5}])
    assert response.status_code == 409


def test_procesar_sin_stock_deposito(client: TestClient):
    """Procesar transferencia sin stock en depósito retorna 409 (RN-11)."""
    # Crear transferencia con renglón de un vino que no tiene stock en depósito
    resp = client.post("/transferencias", json={"id_sala": 1})
    assert resp.status_code == 201
    nro = resp.json()["id_documento"]

    vinos = client.get("/vinos?page=1&limit=1").json()
    if not vinos["data"]:
        pytest.skip("No hay vinos")
    cod = vinos["data"][0]["codigo_vino"]

    client.post(f"/transferencias/{nro}/renglones", json=[{"codigo_vino": cod, "cantidad": 999999}])
    client.post(f"/transferencias/{nro}/terminar")

    response = client.post(f"/transferencias/{nro}/procesar")
    assert response.status_code == 409


def test_get_transferencia_no_existe(client: TestClient):
    """GET /transferencias/{nro} con número inexistente retorna 404."""
    response = client.get("/transferencias/999999")
    assert response.status_code == 404