#!/bin/bash
# ============================================================
# Rebuild all Docker images (no cache)
# ============================================================
set -e

# Move to the project root (two levels up from this script),
# regardless of where the script is run from.
cd "$(dirname "$0")/../.." || {
    echo "ERROR: Could not find the project root from $(dirname "$0")/../.."
    exit 1
}

# docker-compose requires a .env file; create it from the example if missing.
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "Created .env from .env.example"
    else
        echo "ERROR: .env not found and no .env.example to copy from."
        exit 1
    fi
fi

# Use "docker compose" (v2+) when available, fall back to docker-compose.
if docker compose version >/dev/null 2>&1; then
    COMPOSE="docker compose"
else
    COMPOSE="docker-compose"
fi

echo "Rebuilding all Docker images..."
$COMPOSE build --no-cache
echo "Done!"