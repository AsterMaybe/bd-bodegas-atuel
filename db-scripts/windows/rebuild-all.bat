@echo off
REM ============================================================
REM Rebuild all Docker images (no cache)
REM ============================================================
cd /d "C:\Users\Aster\Desktop\Proyecto-db"
echo Rebuilding all Docker images...
docker-compose build --no-cache
echo Done!