import pytest
from fastapi.testclient import TestClient


def test_create_comprobante_sin_stock(client: TestClient):
    """POST /comprobantes sin stock suficiente retorna 409 (P0001 RN-09)."""
    # Obtener un vino y una sala
    vinos = client.get("/vinos?page=1&limit=1").json()
    if not vinos["data"]:
        pytest.skip("No hay vinos")
    cod_vino = vinos["data"][0]["codigo_vino"]

    # Usar sala 1 (debe existir en seed)
    comprobante = {
        "id_cliente": 1,
        "id_sala": 1,
        "renglones": [{"codigo_vino": cod_vino, "cantidad": 999999}],
    }
    response = client.post("/comprobantes", json=comprobante)
    # Debe fallar con 409 (stock insuficiente)
    assert response.status_code == 409
    assert response.json()["statusCode"] == 409
    assert "stock" in response.json()["message"].lower() or "insuficiente" in response.json()["message"].lower()


def test_get_comprobante_no_existe(client: TestClient):
    """GET /comprobantes/{nro} con número inexistente retorna 404."""
    response = client.get("/comprobantes/999999")
    assert response.status_code == 404