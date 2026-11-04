import psycopg
from src.errors.map import map_error, SQLSTATE_MAP


class FakePgError(Exception):
    """Simula un error de psycopg con sqlstate."""

    def __init__(self, msg, sqlstate, constraint=None, detail=None):
        super().__init__(msg)
        self.sqlstate = sqlstate
        self.constraint_name = constraint
        self.detail = detail


def test_sqlstate_23505_unique():
    exc = FakePgError("duplicate key", "23505", constraint="uq_vino_nombre_aniada_volumen")
    err = map_error(exc)
    assert err.status_code == 409
    assert err.error == "Conflict"
    assert "unicidad" in err.message.lower() or "unique" in err.message.lower() or "23505" in str(err.details)


def test_sqlstate_23503_fk():
    exc = FakePgError("fk violation", "23503", constraint="fk_vino_bodega")
    err = map_error(exc)
    assert err.status_code == 409
    assert err.error == "Conflict"


def test_sqlstate_23514_check():
    exc = FakePgError("check violation", "23514", constraint="chk_vino_precio_positivo")
    err = map_error(exc)
    assert err.status_code == 422
    assert err.error == "Unprocessable Entity"


def test_sqlstate_23502_notnull():
    exc = FakePgError("not null violation", "23502", detail='null value in column "nombre"')
    err = map_error(exc)
    assert err.status_code == 422
    assert err.error == "Unprocessable Entity"


def test_sqlstate_p0001_trigger():
    exc = FakePgError("Stock insuficiente del vino 1 en la sala 2 (RN-09)", "P0001")
    err = map_error(exc)
    assert err.status_code == 409
    assert err.error == "Conflict"
    assert "Stock insuficiente" in err.message


def test_sqlstate_22p02_invalid_type():
    exc = FakePgError('invalid input syntax for type integer: "abc"', "22P02")
    err = map_error(exc)
    assert err.status_code == 400
    assert err.error == "Bad Request"


def test_sqlstate_40001_serialization():
    exc = FakePgError("could not serialize access", "40001")
    err = map_error(exc)
    assert err.status_code == 503
    assert err.error == "Service Unavailable"


def test_sqlstate_40p01_deadlock():
    exc = FakePgError("deadlock detected", "40P01")
    err = map_error(exc)
    assert err.status_code == 503
    assert err.error == "Service Unavailable"


def test_unknown_sqlstate():
    exc = FakePgError("unknown error", "99999")
    err = map_error(exc)
    assert err.status_code == 500
    assert err.error == "Internal Server Error"


def test_all_sqlstates_covered():
    """Verifica que todos los SQLSTATE del PDF estén mapeados."""
    expected = {"23505", "23503", "23514", "23502", "P0001", "22P02", "40001", "40P01"}
    assert expected.issubset(set(SQLSTATE_MAP.keys()))