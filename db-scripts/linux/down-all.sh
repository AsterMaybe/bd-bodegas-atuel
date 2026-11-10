#!/bin/bash
# ============================================================
# Stop and remove all services (keep volumes)
# ============================================================
set -e

cd "$(dirname "$0")/../.." || {
    echo "ERROR: Could not find the project root from $(dirname "$0")/../.."
    exit 1
}

if docker compose version >/dev/null 2>&1; then
    COMPOSE="docker compose"
else
    COMPOSE="docker-compose"
fi

echo "Stopping all services..."
$COMPOSE down
echo "Done!"