#!/bin/bash
# ============================================================
# Rebuild all Docker images (no cache)
# ============================================================
set -e

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

if docker compose version >/dev/null 2>&1; then
    COMPOSE="docker compose"
else
    COMPOSE="docker-compose"
fi

echo "Rebuilding all Docker images..."
$COMPOSE build --no-cache
echo "Done!"
