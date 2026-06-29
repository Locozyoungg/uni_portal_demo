#!/bin/sh
# Restore the database from the compressed dump file.
# Usage: ./restore-db.sh

DUMP_FILE="$(dirname "$0")/../seed-data.sql.gz"

if [ ! -f "$DUMP_FILE" ]; then
  echo "ERROR: Dump file not found at $DUMP_FILE"
  echo "Run dump-db.sh first after seeding the database."
  exit 1
fi

echo "=== Restoring KU Portal Database ==="
echo "This will REPLACE all existing data!"
echo "Dump file: $DUMP_FILE ($(du -h "$DUMP_FILE" | cut -f1))"
echo ""
echo "Restoring..."

gunzip -c "$DUMP_FILE" | docker exec -i ku-portal-postgres psql -U kuportal -d ku_portal 2>&1

echo ""
echo "Restore complete. Restart the backend:"
echo "  docker restart ku-portal-backend"
