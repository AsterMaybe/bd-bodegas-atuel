@echo off
setlocal
REM ============================================================
REM Run database seed (data dump)
REM ============================================================
REM Edit SEED_OPTIONS below to customize what data to load
REM ============================================================

cd /d "%~dp0..\.."
if errorlevel 1 (
    echo ERROR: Could not find the project root from "%~dp0..\.."
    exit /b 1
)

echo =============================================
echo Database Seed Options
echo =============================================
echo Current seed script: db/seed/seed.py
echo.
echo To customize seed data, edit:
echo   - %CD%\db\seed\seed.py
echo   - CSV files in %CD%\db\seed\catalogo\
echo.

echo Admin user: admin@bodegasatuel.com / admin123
echo Employee:   empleado@bodegasatuel.com / empleado123
echo =============================================

echo Running seed...
docker exec bodegas_db python3 /opt/seed/seed.py
if errorlevel 1 (
    echo ERROR: Seed failed. Is the bodegas_db container running?
    exit /b 1
)

echo.
echo Seed completed!
echo Verify with: docker exec bodegas_db psql -U postgres -d bodegas_atuel -c "SELECT COUNT(*) FROM USUARIO;"
endlocal
