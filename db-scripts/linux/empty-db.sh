#!/bin/bash
# ============================================================
# Empty the database (drop all tables, keep volumes)
# Usage: ./empty-db.sh [--yes]  (skip confirmation with --yes)
# ============================================================
cd "$(dirname "$0")/../Proyecto-db"

# Check for --yes flag to skip confirmation
if [ "$1" = "--yes" ]; then
    echo "Emptying database..."
else
    echo "WARNING: This will DELETE ALL DATA in the database!"
    read -p "Are you sure? Type 'yes' to confirm: " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Cancelled."
        exit 1
    fi
    echo "Emptying database..."
fi

docker exec -i bodegas_db psql -U postgres -d bodegas_atuel < db/empty_database.sql

echo "Database emptied!"