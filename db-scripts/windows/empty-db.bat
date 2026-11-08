@echo off
REM ============================================================
REM Empty the database (drop all tables, keep volumes)
REM Usage: empty-db.bat [--yes]  (skip confirmation with --yes)
REM ============================================================
cd /d "C:\Users\Aster\Desktop\Proyecto-db"

REM Check for --yes flag to skip confirmation
if "%~1"=="--yes" goto :run_empty

echo WARNING: This will DELETE ALL DATA in the database!
echo.
set /p confirm="Are you sure? Type 'yes' to confirm: "
if "%confirm%" neq "yes" (
    echo Cancelled.
    exit /b 1
)

:run_empty
echo Emptying database...

type db\empty_database.sql | docker exec -i bodegas_db psql -U postgres -d bodegas_atuel

echo Database emptied!