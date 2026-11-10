<# 
.SYNOPSIS
    Run database seed (data dump)

.DESCRIPTION
    Runs the database seed script inside the database container.
    This script works from any directory - it finds the project root automatically.
#>

# Exit on any error
$ErrorActionPreference = "Stop"

# Move to the project root (two levels up from this script)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$projectRoot = Join-Path $scriptDir "..\.."
$projectRoot = Resolve-Path $projectRoot

Write-Host "Project root: $projectRoot"
Set-Location $projectRoot

# Use "docker compose" (v2+) when available, fall back to docker-compose.
$COMPOSE = "docker-compose"
if (Get-Command "docker" -ErrorAction SilentlyContinue) {
    try {
        docker compose version >$null 2>&1
        $COMPOSE = "docker compose"
    } catch {
        # docker compose not available, use docker-compose
    }
}

Write-Host "============================================="
Write-Host "Database Seed Options"
Write-Host "============================================="
Write-Host "Current seed script: db/seed/seed.py"
Write-Host ""
Write-Host "To customize seed data, edit:"
Write-Host "  - $projectRoot\db\seed\seed.py"
Write-Host "  - CSV files in $projectRoot\db\seed\catalogo\"
Write-Host ""
Write-Host "Seed options (modify in seed.py):"
Write-Host "  - SEED = 42           (random seed for reproducibility)"
Write-Host "  - N_EMP = 60          (number of employees)"
Write-Host "  - N_SALA = 30         (number of sales rooms)"
Write-Host "  - N_BODEGA = 20       (number of wineries)"
Write-Host "  - N_TRANSP = 15       (number of transporters)"
Write-Host "  - N_FINCA = 40        (number of farms)"
Write-Host "  - N_PARCELA_TARGET = 600  (number of parcels)"
Write-Host "  - N_VINO = 400        (number of wines)"
Write-Host "  - N_CLIENTE = 20000   (number of clients)"
Write-Host "  - N_INGRESO = 2500    (number of income documents)"
Write-Host "  - N_TRANSF = 2500     (number of transfers)"
Write-Host "  - N_COMP = 150000     (number of sales receipts)"
Write-Host "  - CAMPAIGNS = [2022,2023,2024,2025,2026]"
Write-Host "  - Admin user: admin@bodegasatuel.com / admin123"
Write-Host "  - Employee:   empleado@bodegasatuel.com / empleado123"
Write-Host "============================================="

Write-Host "Running seed..."
# Use docker compose exec to run inside the db service container
if ($COMPOSE -eq "docker compose") {
    docker compose exec -T db python3 /opt/seed/seed.py
} else {
    docker-compose exec -T db python3 /opt/seed/seed.py
}

Write-Host ""
Write-Host "Seed completed!"
Write-Host "Verify with: $COMPOSE exec db psql -U postgres -d bodegas_atuel -c \"SELECT COUNT(*) FROM USUARIO;\""