@echo off
setlocal
REM ============================================================
REM Rebuild all Docker images (no cache)
REM ============================================================

cd /d "%~dp0..\.."
if errorlevel 1 (
    echo ERROR: Could not find the project root from "%~dp0..\.."
    exit /b 1
)

REM docker-compose requires a .env file; create it from the example if missing.
if not exist ".env" (
    if exist ".env.example" (
        copy /y ".env.example" ".env" >nul
        echo Created .env from .env.example
    ) else (
        echo ERROR: .env not found and no .env.example to copy from.
        exit /b 1
    )
)

set "COMPOSE=docker compose"
docker compose version >nul 2>&1 || set "COMPOSE=docker-compose"

echo Rebuilding all Docker images...
%COMPOSE% build --no-cache
if errorlevel 1 (
    echo ERROR: Failed to build the images. Is Docker running?
    exit /b 1
)
echo Done!
endlocal
