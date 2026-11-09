#!/bin/bash
# ============================================================
# Run database seed (data dump)
# ============================================================
# Edit SEED_OPTIONS below to customize what data to load
# ============================================================
set -e

cd "$(dirname "$0")/../.." || {
    echo "ERROR: Could not find the project root from $(dirname "$0")/../.."
    exit 1
}

echo "============================================="
echo "Database Seed Options"
echo "============================================="
echo "Current seed script: db/seed/seed.py"
echo ""
echo "To customize seed data, edit:"
echo "  - $(pwd)/db/seed/seed.py"
echo "  - CSV files in $(pwd)/db/seed/catalogo/"
echo ""
echo "Seed options (modify in seed.py):"
echo "  - SEED = 42           (random seed for reproducibility)"
echo "  - N_EMP = 60          (number of employees)"
echo "  - N_SALA = 30         (number of sales rooms)"
echo "  - N_BODEGA = 20       (number of wineries)"
echo "  - N_TRANSP = 15       (number of transporters)"
echo "  - N_FINCA = 40        (number of farms)"
echo "  - N_PARCELA_TARGET = 600  (number of parcels)"
echo "  - N_VINO = 400        (number of wines)"
echo "  - N_CLIENTE = 20000   (number of clients)"
echo "  - N_INGRESO = 2500    (number of income documents)"
echo "  - N_TRANSF = 2500     (number of transfers)"
echo "  - N_COMP = 150000     (number of sales receipts)"
echo "  - CAMPAIGNS = [2022,2023,2024,2025,2026]"
echo "  - Admin user: admin@bodegasatuel.com / admin123"
echo "  - Employee:   empleado@bodegasatuel.com / empleado123"
echo "============================================="

echo "Running seed..."
docker exec bodegas_db python3 /opt/seed/seed.py

echo ""
echo "Seed completed!"
echo "Verify with: docker exec bodegas_db psql -U postgres -d bodegas_atuel -c \"SELECT COUNT(*) FROM USUARIO;\""
