#!/bin/bash
# ============================================================
# Stop and remove all services (keep volumes)
# ============================================================
cd "$(dirname "$0")/../Proyecto-db"
echo "Stopping all services..."
docker-compose down
echo "Done!"