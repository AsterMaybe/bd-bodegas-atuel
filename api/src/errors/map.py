from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from pydantic import ValidationError


@dataclass
class ApiError:
    status_code: int
    error: str
    message: str
    details: dict[str, Any] | None = field(default=None)


# Tabla de traducción SQLSTATE → HTTP (según PDF Etapa 6)
SQLSTATE_MAP: dict[str, tuple[int, str]] = {
    "23505": (409, "Conflict"),          # UNIQUE violado
    "23503": (409, "Conflict"),          # FOREIGN KEY violada
    "23514": (422, "Unprocessable Entity"),  # CHECK violado
    "23502": (422, "Unprocessable Entity"),  # NOT NULL violado
    "P0001": (409, "Conflict"),          # RAISE EXCEPTION en triggers/procs
    "22P02": (400, "Bad Request"),       # Tipo de dato inválido
    "40001": (503, "Service Unavailable"),  # Fallo de serialización
    "40P01": (503, "Service Unavailable"),  # Deadlock
}


def map_pg_error(exc: Exception) -> ApiError:
    """Traduce una excepción psycopg a ApiError según SQLSTATE."""
    sqlstate = getattr(exc, "sqlstate", None) or "XXXXX"
    mapping = SQLSTATE_MAP.get(sqlstate)

    if mapping is None:
        return ApiError(
            status_code=500,
            error="Internal Server Error",
            message="Error interno del servidor",
        )

    status, error = mapping
    message = str(exc)

    # Enriquecer mensaje según SQLSTATE
    constraint = getattr(exc, "constraint_name", None) or getattr(exc, "constraint", None)
    detail = getattr(exc, "detail", None)
    column = None

    # Extraer column de detail para NOT NULL
    if sqlstate == "23502" and detail:
        # detail suele ser "Failing row contains (...)." o "null value in column \"col\""
        if "column" in detail.lower():
            column = detail

    if sqlstate == "23505" and constraint:
        message = f"Violación de unicidad: {constraint}"
    elif sqlstate == "23503" and constraint:
        message = f"Violación de clave foránea: {constraint}"
    elif sqlstate == "23514" and constraint:
        message = f"Violación de restricción CHECK: {constraint}"
    elif sqlstate == "23502":
        message = "Campo requerido no proporcionado"
        if column:
            message = f"Campo requerido: {column}"
    elif sqlstate == "22P02":
        message = "Formato de dato inválido"
    elif sqlstate in ("40001", "40P01"):
        message = "Conflicto de concurrencia, intente nuevamente"

    # Para P0001, el mensaje ya viene de la BD (RAISE EXCEPTION)
    # Se deja tal cual (mensaje de la regla)

    details = {
        "sqlstate": sqlstate,
        "constraint": constraint,
        "detail": detail,
    }

    return ApiError(
        status_code=status,
        error=error,
        message=message,
        details=details,
    )


def map_pydantic_error(exc: ValidationError) -> ApiError:
    """Traduce errores de validación Pydantic a 400 Bad Request."""
    issues = []
    for err in exc.errors():
        issues.append({
            "loc": err.get("loc", []),
            "msg": err.get("msg", ""),
            "type": err.get("type", ""),
        })

    return ApiError(
        status_code=400,
        error="Bad Request",
        message="Datos de entrada inválidos",
        details={"issues": issues},
    )


def map_generic_error(exc: Exception) -> ApiError:
    return ApiError(
        status_code=500,
        error="Internal Server Error",
        message=str(exc) or "Error interno del servidor",
    )


def map_error(exc: Exception) -> ApiError:
    """Punto de entrada central para mapear cualquier excepción a ApiError."""
    # Pydantic ValidationError
    if isinstance(exc, ValidationError):
        return map_pydantic_error(exc)

    # psycopg errors tienen atributo sqlstate
    if hasattr(exc, "sqlstate") and exc.sqlstate is not None:
        return map_pg_error(exc)

    # psycopg pool errors / connection errors
    if "connection" in str(exc).lower() or "pool" in str(exc).lower():
        return ApiError(
            status_code=503,
            error="Service Unavailable",
            message="Servicio de base de datos no disponible",
        )

    return map_generic_error(exc)