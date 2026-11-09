@echo off
setlocal
REM ============================================================
REM Start all services with docker-compose
REM ============================================================

REM Move to the project root (two levels up from this script),
REM regardless of where the script is run from.
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

REM Use "docker compose" (v2+) when available, fall back to docker-compose.
set "COMPOSE=docker compose"
docker compose version >nul 2>&1 || set "COMPOSE=docker-compose"

echo Starting all services from "%CD%"...
%COMPOSE% up -d
if errorlevel 1 (
    echo ERROR: Failed to start the containers. Is Docker running?
    exit /b 1
)

echo Waiting for services to be healthy...
%COMPOSE% ps
echo Done! Frontend: http://localhost:3000 ^| API: http://localhost:8000/docs
endlocal
