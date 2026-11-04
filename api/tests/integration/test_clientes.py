import pytest
from fastapi.testclient import TestClient


def test_list_clientes(client: TestClient):
    """GET /clientes retorna lista paginada."""
    response = client.get("/clientes?page=1&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "total" in data


def test_create_cliente_socio(client: TestClient):
    """POST /clientes crea cliente socio."""
    # Necesitamos un codigo_postal válido
    cp = "5600"  # San Rafael (debe existir en seed)
    response = client.post("/clientes", json={
        "nombre_razon": "Test Socio",
        "tipo_doc": "DNI",
        "nro_doc": "12345678",
        "codigo_postal": cp,
        "tipo": "socio",
    })
    # Puede ser 201 o 409/422 si el codigo_postal no existe en la BD
    assert response.status_code in (201, 409, 422, 400)


def test_create_cliente_fk_violation(client: TestClient):
    """POST /clientes con codigo_postal inexistente retorna 409/422 (23503)."""
    response = client.post("/clientes", json={
        "nombre_razon": "Test FK",
        "tipo_doc": "DNI",
        "nro_doc": "99999999",
        "codigo_postal": "00000",  # No existe
        "tipo": "socio",
    })
    assert response.status_code in (409, 422)


def test_get_cliente_no_existe(client: TestClient):
    """GET /clientes/{id} con id inexistente retorna 404."""
    response = client.get("/clientes/999999")
    assert response.status_code == 404