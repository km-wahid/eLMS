#!/bin/sh
set -e

echo "⏳ Waiting for database..."
python manage.py wait_for_db 2>/dev/null || sleep 5

echo "📦 Running migrations..."
python manage.py migrate --noinput

echo "📂 Collecting static files..."
python manage.py collectstatic --noinput --clear 2>/dev/null || true

echo "🚀 Starting server..."
exec "$@"
