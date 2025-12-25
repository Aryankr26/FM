#!/usr/bin/env bash

# Fleet Backend - Quick Start Script
# This script sets up the database and starts the development server

set -e

echo "🚀 Fleet Backend - Quick Start"
echo "================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "⚙️  Please update .env with your database credentials and re-run this script."
    exit 1
fi

echo "✓ .env file found"

# Check if dependencies are installed
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "✓ Dependencies installed"

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npm run prisma:generate

echo "✓ Prisma Client generated"

# Try to run migrations
echo "🗄️  Running database migrations..."
if npm run prisma:migrate -- --skip-seed; then
    echo "✓ Migrations completed"
else
    echo "⚠️  Migrations skipped (database might not be ready)"
fi

# Try to seed
echo "🌱 Seeding initial data..."
if npm run seed; then
    echo "✓ Database seeded"
else
    echo "⚠️  Seed skipped (you can run 'npm run seed' manually later)"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "   1. Start dev server: npm run dev"
echo "   2. Health check: curl http://localhost:4000/health"
echo "   3. API docs: See SETUP.md for endpoint list"
echo ""
