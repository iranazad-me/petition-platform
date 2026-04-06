#!/bin/sh

echo "🚀 Starting Iran Azad Petition Platform..."
echo "=========================================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  echo "This app requires a PostgreSQL database connection."
  exit 1
fi

# Check if PETITION_HMAC_SECRET is set
if [ -z "$PETITION_HMAC_SECRET" ]; then
  echo "❌ ERROR: PETITION_HMAC_SECRET environment variable is not set"
  echo "This app requires a secret key for security."
  exit 1
fi

echo "✅ Environment variables verified"

# Run database migrations (optional for Docker deployments)
echo "📊 Running database migrations..."
if pnpm db:migrate 2>/dev/null; then
  echo "✅ Migrations completed successfully"
else
  echo "⚠️  Migrations already applied or failed - continuing..."
fi
# Start the server
echo "🌐 Starting server on port ${PORT:-3000}..."
echo "=========================================="
exec node server.js
