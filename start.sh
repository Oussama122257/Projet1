#!/bin/bash
set -e

echo "🚀 Starting KIE.ai SaaS Dashboard..."

# Install dependencies if needed
if [ ! -d "backend/node_modules" ]; then
  echo "📦 Installing backend dependencies..."
  cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  cd frontend && npm install && cd ..
fi

# Copy .env if not exists
if [ ! -f "backend/.env" ]; then
  cp backend/.env.example backend/.env
  echo "⚙️  Created backend/.env - please add your KIE_API_KEY"
fi

echo ""
echo "✅ Starting servers..."
echo "   Backend:  http://localhost:3001"
echo "   Frontend: http://localhost:5173"
echo ""

# Start both
trap 'kill %1 %2 2>/dev/null' EXIT
cd backend && npm run dev &
cd frontend && npm run dev &
wait
