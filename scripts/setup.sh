#!/usr/bin/env bash
# One-command setup for SafeWalk.
# Assumes you have: docker, node, python3, uv, git

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "==> SafeWalk setup"
echo ""

# --- .env ---
if [ ! -f .env ]; then
    echo "Creating .env from .env.example"
    cp .env.example .env
fi

# --- frontend .env.local ---
if [ ! -f frontend/.env.local ]; then
    echo ""
    echo "frontend/.env.local not found."
    echo "Ask the project owner for the Google Maps API key, then add it as:"
    echo "  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here"
    echo ""
fi

# --- Database ---
echo "==> Starting PostgreSQL + PostGIS via Docker"
docker compose up -d

echo ""
echo "==> Waiting 5s for database to start..."
sleep 5

# --- Backend ---
echo ""
echo "==> Setting up backend"
cd backend

if [ ! -d .venv ]; then
    uv venv
fi
uv pip install -r requirements.txt

source .venv/bin/activate
alembic upgrade head
python seed_data.py

deactivate
cd "$REPO_ROOT"

# --- Frontend ---
echo ""
echo "==> Setting up frontend"
cd frontend
npm install
cd "$REPO_ROOT"

echo ""
echo "==> Setup complete"
echo ""
echo "Start the backend:   cd backend && source .venv/bin/activate && uvicorn app.main:app --reload"
echo "Start the frontend:  cd frontend && npm run dev"
echo "Then open:           http://localhost:3000"
