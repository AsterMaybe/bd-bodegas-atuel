@echo off
REM ============================================================
REM Run database seed (data dump)
REM ============================================================
REM Edit SEED_OPTIONS below to customize what data to load
REM ============================================================

cd /d "C:\Users\Aster\Desktop\Proyecto-db"

echo =============================================
echo Database Seed Options
echo =============================================
echo Current seed script: db/seed/seed.py
echo.
echo To customize seed data, edit:
echo   - C:\Users\Aster\Desktop\Proyecto-db\db\seed\seed.py
echo   - CSV files in C:\Users\Aster\Desktop\Proyecto-db\db\seed\catalogo\
echo.

echo Admin user: admin@bodegasatuel.com / admin123
echo Employee:   empleado@bodegasatuel.com / empleado123
echo =============================================

echo Running seed...
docker exec bodegas_db python3 /opt/seed/seed.py

echo.
echo Seed completed!
echo Verify with: docker exec bodegas_db psql -U postgres -d bodegas_atuel -c "SELECT COUNT(*) FROM USUARIO;"