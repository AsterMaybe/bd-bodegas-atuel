from fastapi import Request
from fastapi.responses import JSONResponse

from src.errors.map import ApiError, map_error


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handler global de excepciones para FastAPI."""
    try:
        api_error: ApiError = map_error(exc)
    except Exception as e:
        print(f"Error en map_error: {e}")
        api_error = ApiError(status_code=500, error="Internal Server Error", message=str(exc))

    # Log
    if api_error.status_code >= 500:
        print(f"ERROR 5xx: {exc}")
    else:
        print(f"ERROR {api_error.status_code}: {api_error.message}")

    content = {
        "statusCode": api_error.status_code,
        "error": api_error.error,
        "message": api_error.message,
    }
    if api_error.details:
        content["details"] = api_error.details

    return JSONResponse(
        status_code=api_error.status_code,
        content=content,
    )