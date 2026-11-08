#!/bin/bash
# ============================================================
# Rebuild all Docker images (no cache)
# ============================================================
cd "$(dirname "$0")/../Proyecto-db"
echo "Rebuilding all Docker images..."
docker-compose build --no-cache
echo "Done!"