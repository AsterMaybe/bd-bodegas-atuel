#!/bin/bash
# ============================================================
# Start all services with docker-compose
# ============================================================
cd "$(dirname "$0")/../Proyecto-db"
echo "Starting all services..."
docker-compose up -d
echo "Waiting for services to be healthy..."
docker-compose ps
echo "Done! Frontend: http://localhost:3000 | API: http://localhost:8000/docs"