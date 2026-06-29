#!/bin/sh
# Dump the seeded database to a compressed SQL file for fast restoration.
# Usage: ./dump-db.sh
# Output: ../seed-data.sql.gz (compressed PostgreSQL dump)

OUTPUT_FILE="$(dirname "$0")/../seed-data.sql.gz"

echo "=== Dumping KU Portal Database ==="
echo "This may take 1-2 minutes..."
docker exec ku-portal-postgres pg_dump \
  -U kuportal \
  -d ku_portal \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  | gzip > "$OUTPUT_FILE"

echo "Database dumped to: $OUTPUT_FILE"
echo "Size: $(du -h "$OUTPUT_FILE" | cut -f1)"
echo ""
echo "To restore: gunzip -c seed-data.sql.gz | docker exec -i ku-portal-postgres psql -U kuportal -d ku_portal"
