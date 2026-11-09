@echo off
setlocal
REM ============================================================
REM Stop and remove all services (keep volumes)
REM ============================================================

cd /d "%~dp0..\.."
if errorlevel 1 (
    echo ERROR: Could not find the project root from "%~dp0..\.."
    exit /b 1
)

set "COMPOSE=docker compose"
docker compose version >nul 2>&1 || set "COMPOSE=docker-compose"

echo Stopping all services...
%COMPOSE% down
if errorlevel 1 (
    echo ERROR: Failed to stop the containers.
    exit /b 1
)
echo Done!
endlocal
