#!/bin/bash
set -e

echo "=========================================="
echo "Rebuilding Frontend Container"
echo "=========================================="
echo ""

cd "$(dirname "$0")/.."

echo "Step 1: Stopping frontend container..."
docker-compose stop frontend || true

echo ""
echo "Step 2: Removing old frontend container..."
docker-compose rm -f frontend || true

echo ""
echo "Step 3: Rebuilding frontend (this may take a few minutes)..."
docker-compose build --no-cache frontend

echo ""
echo "Step 4: Starting frontend container..."
docker-compose up -d frontend

echo ""
echo "=========================================="
echo "✓ Frontend rebuild completed!"
echo "=========================================="
echo ""
echo "Please:"
echo "1. Hard refresh your browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)"
echo "2. Clear browser cache if needed"
echo "3. Navigate to http://localhost:3000"
echo ""
echo "You should now see the 'Create Default System Admin' button!"
echo ""
