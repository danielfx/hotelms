#!/bin/sh
echo "=== Waiting for database ==="
sleep 5
echo "=== Running migrations ==="
npx prisma migrate deploy 2>&1
echo "=== Running seed ==="
npx prisma db seed 2>&1
echo "=== Starting server ==="
exec node dist/main.js
