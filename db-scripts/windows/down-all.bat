@echo off
REM ============================================================
REM Stop and remove all services (keep volumes)
REM ============================================================
cd /d "C:\Users\Aster\Desktop\Proyecto-db"
echo Stopping all services...
docker-compose down
echo Done!