<# 
.SYNOPSIS
    Stop and remove all services (keep volumes)

.DESCRIPTION
    Stops and removes all services defined in docker-compose.yaml.
    Volumes are preserved. This script works from any directory.
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

Write-Host "Stopping all services..."
if ($COMPOSE -eq "docker compose") {
    docker compose down
} else {
    docker-compose down
}
Write-Host "Done!"