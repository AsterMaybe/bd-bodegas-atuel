<# 
.SYNOPSIS
    Empty the database (drop all tables, keep volumes)

.DESCRIPTION
    Empties the database by running the SQL script. Supports --yes flag to skip confirmation.
    This script works from any directory - it finds the project root automatically.

.PARAMETER Yes
    Skip confirmation prompt.
#>

param(
    [switch]$Yes
)

# Exit on any error
$ErrorActionPreference = "Stop"

# Move to the project root (two levels up from this script)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$projectRoot = Join-Path $scriptDir "..\.."
$projectRoot = Resolve-Path $projectRoot

Write-Host "Project root: $projectRoot"
Set-Location $projectRoot

if (-not (Test-Path "db\empty_database.sql")) {
    Write-Error "ERROR: db\empty_database.sql not found in $(Get-Location)."
    exit 1
}

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

# Check for --yes flag to skip confirmation
if ($Yes) {
    Write-Host "Emptying database..."
} else {
    Write-Warning "WARNING: This will DELETE ALL DATA in the database!"
    $confirm = Read-Host "Are you sure? Type 'yes' to confirm"
    if ($confirm -ne "yes") {
        Write-Host "Cancelled."
        exit 1
    }
    Write-Host "Emptying database..."
}

# Use docker compose exec to run inside the db service container
$scriptContent = Get-Content "db\empty_database.sql" -Raw
if ($COMPOSE -eq "docker compose") {
    docker compose exec -T db psql -U postgres -d bodegas_atuel -c $scriptContent
} else {
    docker-compose exec -T db psql -U postgres -d bodegas_atuel -c $scriptContent
}

Write-Host "Database emptied!"