#!/bin/sh
set -e

echo "=== KU Portal Startup ==="
echo "Running prisma db push..."
npx prisma db push --skip-generate

# Check if database is already seeded
echo "Checking if database needs seeding..."
USER_COUNT=$(npx tsx -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.count().then(c => { console.log(c); p.\$disconnect(); });
" 2>/dev/null | tail -1)

echo "Current user count: ${USER_COUNT:-0}"

if [ -z "$USER_COUNT" ] || [ "$USER_COUNT" = "0" ]; then
  echo "Database is empty."

  # Check for dump file for fast restore
  DUMP_FILE="/app/seed-data.sql.gz"
  if [ -f "$DUMP_FILE" ]; then
    echo "Found seed dump: $DUMP_FILE ($(du -h "$DUMP_FILE" | cut -f1))"
    echo "Restoring from dump (fast, ~30 seconds)..."
    gunzip -c "$DUMP_FILE" | PGPASSWORD="${POSTGRES_PASSWORD:-kuportal123}" psql \
      -h "${POSTGRES_HOST:-postgres}" \
      -U "${POSTGRES_USER:-kuportal}" \
      -d "${POSTGRES_DB:-ku_portal}" 2>&1
    echo "Database restored from dump!"
  else
    echo "No dump file found. Running full seed (slow, ~37 minutes)..."
    npx tsx prisma/seeds/seed.ts
    echo "Seed completed."
    echo "TIP: Run dump-db.sh to save this data for fast future restores."
  fi
else
  echo "Database already has $USER_COUNT users. Skipping seed."
  echo "To re-seed: docker exec ku-portal-backend npx tsx prisma/seeds/seed.ts"
fi

echo "Starting NestJS application..."
exec node dist/src/main.js
