<# 
.SYNOPSIS
    Start all services with docker-compose

.DESCRIPTION
    Starts all services defined in docker-compose.yaml in detached mode.
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

# docker-compose requires a .env file; create it from the example if missing.
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "Created .env from .env.example"
    } else {
        Write-Error "ERROR: .env not found and no .env.example to copy from."
        exit 1
    }
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

Write-Host "Starting all services from $(Get-Location)..."
if ($COMPOSE -eq "docker compose") {
    docker compose up -d
} else {
    docker-compose up -d
}
Write-Host "Waiting for services to be healthy..."
if ($COMPOSE -eq "docker compose") {
    docker compose ps
} else {
    docker-compose ps
}
Write-Host "Done! Frontend: http://localhost:3000 | API: http://localhost:8000/docs"