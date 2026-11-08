@echo off
REM ============================================================
REM Start all services with docker-compose
REM ============================================================
cd /d "C:\Users\Aster\Desktop\Proyecto-db"
echo Starting all services...
docker-compose up -d
echo Waiting for services to be healthy...
docker-compose ps
echo Done! Frontend: http://localhost:3000 | API: http://localhost:8000/docs