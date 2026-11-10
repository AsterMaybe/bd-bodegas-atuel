# Database Scripts

Scripts for managing the Docker-based database and services.

## Directory Structure

```
db-scripts/
├── linux/          # Bash scripts for Linux/macOS
│   ├── up-all.sh       # Start all services
│   ├── down-all.sh     # Stop all services (keep volumes)
│   ├── rebuild-all.sh  # Rebuild all images (no cache)
│   ├── seed-db.sh      # Run database seed
│   └── empty-db.sh     # Empty database (drop all tables)
└── windows/        # PowerShell scripts for Windows
    ├── up-all.ps1
    ├── down-all.ps1
    ├── rebuild-all.ps1
    ├── seed-db.ps1
    └── empty-db.ps1
```

## Usage

### Linux/macOS

```bash
# Make scripts executable (first time only)
chmod +x db-scripts/linux/*.sh

# Start all services
./db-scripts/linux/up-all.sh

# Stop all services
./db-scripts/linux/down-all.sh

# Rebuild all images (no cache)
./db-scripts/linux/rebuild-all.sh

# Seed database with sample data
./db-scripts/linux/seed-db.sh

# Empty database (with confirmation)
./db-scripts/linux/empty-db.sh

# Empty database (skip confirmation)
./db-scripts/linux/empty-db.sh --yes
```

### Windows (PowerShell)

```powershell
# Start all services
.\db-scripts\windows\up-all.ps1

# Stop all services
.\db-scripts\windows\down-all.ps1

# Rebuild all images (no cache)
.\db-scripts\windows\rebuild-all.ps1

# Seed database with sample data
.\db-scripts\windows\seed-db.ps1

# Empty database (with confirmation)
.\db-scripts\windows\empty-db.ps1

# Empty database (skip confirmation)
.\db-scripts\windows\empty-db.ps1 -Yes
```

## Requirements

- Docker and Docker Compose (v2+ recommended)
- `.env` file in project root (created automatically from `.env.example` if missing)

## Notes

- All scripts automatically find the project root, so they can be run from any directory
- Scripts use `docker compose` (v2+) when available, falling back to `docker-compose` (v1)
- The `seed-db` and `empty-db` scripts use `docker compose exec` to run commands inside the database service container, avoiding hardcoded container names
- Volumes are preserved when stopping services (`down-all`) to keep database data