#!/usr/bin/env bash
set -e

echo "🚀 Starting BubbleUp Application..."
echo ""
echo "This will start all services:"
echo "  - PostgreSQL Database (port 5432)"
echo "  - Backend API (http://localhost:8000)"
echo "  - Frontend (http://localhost:3000)"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Stop any existing containers
echo "🧹 Stopping any existing containers..."
docker-compose down

# Build and start all services
echo "🏗️  Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 5

# Check service health
echo ""
echo "✅ Services started!"
echo ""
echo "📍 Access your application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "📊 View logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose down"
