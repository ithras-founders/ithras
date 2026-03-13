#!/bin/bash
set -e

echo "=========================================="
echo "Ithras Database Reset Script"
echo "=========================================="
echo ""
echo "This script will:"
echo "  1. Stop all containers"
echo "  2. Remove all volumes (deletes all data!)"
echo "  3. Remove orphan containers"
echo "  4. Rebuild and start services"
echo "  5. Wait for database to be ready"
echo "  6. Verify database connection"
echo ""
echo "WARNING: This will delete all database data!"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Step 1: Stopping containers..."
docker-compose down

echo ""
echo "Step 2: Removing volumes..."
docker-compose down -v

echo ""
echo "Step 3: Removing orphan containers..."
docker-compose down --remove-orphans -v || true

echo ""
echo "Step 4: Rebuilding and starting services..."
docker-compose build --no-cache
docker-compose up -d

echo ""
echo "Step 5: Waiting for database to be ready..."
echo "This may take 30-60 seconds..."
sleep 15

# Wait for database to be healthy
MAX_WAIT=60
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if docker-compose ps db | grep -q "healthy"; then
        echo "✓ Database is healthy"
        break
    fi
    echo "  Waiting for database healthcheck... ($WAITED/$MAX_WAIT seconds)"
    sleep 5
    WAITED=$((WAITED + 5))
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo "⚠ Database healthcheck timeout. Checking logs..."
    docker-compose logs db | tail -20
    echo ""
    echo "Database may still be initializing. Check logs with:"
    echo "  docker-compose logs db"
    exit 1
fi

echo ""
echo "Step 6: Applying Alembic migrations and verifying schema..."
sleep 5

if docker-compose exec -T backend alembic upgrade head; then
    echo ""
    echo "=========================================="
    echo "✓ Database reset completed successfully!"
    echo "=========================================="
    echo ""
    echo "Services are running:"
    docker-compose ps
    echo ""
    echo "To view logs:"
    echo "  docker-compose logs -f backend"
    echo ""
    echo "To stop services:"
    echo "  docker-compose down"
    echo ""
else
    echo ""
    echo "=========================================="
    echo "✗ Database verification failed"
    echo "=========================================="
    echo ""
    echo "Check logs with:"
    echo "  docker-compose logs backend"
    echo "  docker-compose logs db"
    exit 1
fi
