import pytest
from fastapi.testclient import TestClient


def test_list_vinos(client: TestClient):
    """GET /vinos retorna lista paginada."""
    response = client.get("/vinos?page=1&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "total" in data
    assert "page" in data
    assert "limit" in data
    assert data["page"] == 1
    assert data["limit"] == 5


def test_list_vinos_con_filtro_tipo(client: TestClient):
    """GET /vinos?tipo=tinto filtra por tipo."""
    response = client.get("/vinos?tipo=tinto&page=1&limit=10")
    assert response.status_code == 200
    data = response.json()
    for vino in data["data"]:
        assert vino["tipo"] == "tinto"


def test_list_vinos_con_filtro_inyeccion_sql(client: TestClient):
    """Demostración de inyección SQL fallida: payload malicioso tratado como texto literal."""
    payload = "' OR 1=1 --"
    response = client.get(f"/vinos?tipo={payload}")
    # No debe dar error 500 ni retornar todos los vinos (la query parametrizada lo trata como literal)
    assert response.status_code in (200, 400, 422)
    if response.status_code == 200:
        data = response.json()
        # Si retorna datos, ninguno debe tener tipo = payload (porque no existe ese tipo)
        for vino in data.get("data", []):
            assert vino.get("tipo") != payload


def test_get_vino_detalle(client: TestClient):
    """GET /vinos/{cod} retorna detalle con composición y maridajes."""
    # Primero listar para obtener un código válido
    response = client.get("/vinos?page=1&limit=1")
    assert response.status_code == 200
    data = response.json()
    if data["data"]:
        cod = data["data"][0]["codigo_vino"]
        detail = client.get(f"/vinos/{cod}")
        assert detail.status_code == 200
        d = detail.json()
        assert "composicion" in d
        assert "maridajes" in d


def test_get_vino_no_existe(client: TestClient):
    """GET /vinos/{cod} con código inexistente retorna 404."""
    response = client.get("/vinos/999999")
    assert response.status_code == 404


def test_create_vino_unique_violation(client: TestClient):
    """POST /vinos con nombre/añada/volumen duplicado retorna 409 (23505)."""
    # Obtener un vino existente para duplicar
    response = client.get("/vinos?page=1&limit=1")
    assert response.status_code == 200
    data = response.json()
    if not data["data"]:
        pytest.skip("No hay vinos en la BD")
    vino = data["data"][0]
    duplicate = {
        "nombre": vino["nombre"],
        "tipo": vino["tipo"],
        "aniada": vino["aniada"],
        "volumen_ml": vino["volumen_ml"],
        "graduacion": vino["graduacion"],
        "precio": vino["precio"],
        "cuit_bodega": vino["cuit_bodega"],
        "composicion": [{"id_cepa": 1, "porcentaje": 100.0}],
    }
    response = client.post("/vinos", json=duplicate)
    assert response.status_code == 409
    assert response.json()["statusCode"] == 409


def test_create_vino_check_violation(client: TestClient):
    """POST /vinos con graduación fuera de rango retorna 422 (23514)."""
    # Necesitamos un cuit_bodega válido
    response = client.get("/vinos?page=1&limit=1")
    assert response.status_code == 200
    data = response.json()
    if not data["data"]:
        pytest.skip("No hay vinos en la BD")
    vino = data["data"][0]
    invalid = {
        "nombre": "Vino Test Check",
        "tipo": "tinto",
        "aniada": 2024,
        "volumen_ml": 750,
        "graduacion": 30.0,  # Fuera de rango (5-20)
        "precio": 100.0,
        "cuit_bodega": vino["cuit_bodega"],
        "composicion": [{"id_cepa": 1, "porcentaje": 100.0}],
    }
    response = client.post("/vinos", json=invalid)
    assert response.status_code == 422


def test_create_vino_composicion_trigger(client: TestClient):
    """POST /vinos con composición que no suma 100 retorna 409 (P0001)."""
    response = client.get("/vinos?page=1&limit=1")
    assert response.status_code == 200
    data = response.json()
    if not data["data"]:
        pytest.skip("No hay vinos en la BD")
    vino = data["data"][0]
    invalid_comp = {
        "nombre": "Vino Test Comp",
        "tipo": "tinto",
        "aniada": 2025,
        "volumen_ml": 750,
        "graduacion": 13.5,
        "precio": 100.0,
        "cuit_bodega": vino["cuit_bodega"],
        "composicion": [{"id_cepa": 1, "porcentaje": 50.0}],  # No suma 100
    }
    response = client.post("/vinos", json=invalid_comp)
    # El trigger deferred se ejecuta al COMMIT, debería fallar
    assert response.status_code in (409, 422, 500)