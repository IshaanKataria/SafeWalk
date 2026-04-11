SafeWalk -- Walking Route Safety Scorer

Score any walking route for safety at any time of day using street lighting density, crime data, and community reports.

Built for Macathon 2026.


Prerequisites

    - Docker Desktop (for PostgreSQL + PostGIS)
    - Node.js 18+ and npm
    - Python 3.11+ and uv (https://docs.astral.sh/uv/)
    - Git


Quick Setup

1. Clone the repo

    git clone https://github.com/IshaanKataria/SafeWalk.git
    cd SafeWalk

2. Environment variables

    cp .env.example .env

    The app works out of the box with mock data -- no API keys needed.
    To enable real Google Maps routing, add your key to .env and set USE_MOCK_DATA=false.

3. Start the database

    docker compose up -d

    This starts PostgreSQL + PostGIS on port 5433.
    Make sure Docker Desktop is running first.

4. Backend

    cd backend
    uv venv && uv pip install -r requirements.txt
    source .venv/bin/activate
    alembic upgrade head
    uvicorn app.main:app --reload

    Runs on http://localhost:8000
    Health check: http://localhost:8000/api/health

5. Frontend

    cd frontend
    npm install
    npm run dev

    Runs on http://localhost:3000
    API calls proxy to the backend automatically.

6. Google Maps API key (REQUIRED for the map to render)

    The API key is not stored in the repo. Create a file at frontend/.env.local with:

        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=ask_ishaan_for_the_key

    Ask the project owner for the key. It is restricted to localhost:3000, so safe to share within the team.

    If you prefer to use your own, create one at https://console.cloud.google.com:
        - Enable: Maps JavaScript API, Directions API, Places API
        - Credentials -> Create Credentials -> API Key
        - Restrict to HTTP referrer http://localhost:3000/*

    After adding the key, restart the frontend (Ctrl+C then npm run dev again).
    The rest of the app (scoring, routes, panels) works without this key.


Project Structure

    SafeWalk/
    ├── backend/            FastAPI + PostGIS
    │   ├── app/
    │   │   ├── main.py         API entry point, CORS, router mounting
    │   │   ├── config.py       Settings from .env
    │   │   ├── database.py     SQLAlchemy engine + session
    │   │   ├── routers/        API endpoints (scoring, routes, reports)
    │   │   ├── services/       Business logic (scoring engine, route scorer, data loader)
    │   │   ├── models/         SQLAlchemy models (PostGIS geometry)
    │   │   ├── schemas/        Pydantic request/response models
    │   │   └── mock_data/      Sample crime, lighting, and route data
    │   └── alembic/            Database migrations
    └── frontend/           Next.js + Tailwind
        └── src/
            ├── app/            Pages and layout
            ├── components/     MapView, RouteForm, RoutePanel, SafetyLegend
            ├── hooks/          useRoutes
            ├── lib/            API wrapper, colour utilities
            └── types/          TypeScript interfaces


For ML Team

You do NOT need the frontend or a Google Maps API key. Your work is backend only.

Setup:

    git clone https://github.com/IshaanKataria/SafeWalk.git
    cd SafeWalk
    cp .env.example .env
    docker compose up -d
    cd backend
    uv venv && uv pip install -r requirements.txt
    source .venv/bin/activate
    alembic upgrade head
    uvicorn app.main:app --reload

Scoring endpoint contract (stable -- do not change the interface):

    POST /api/score-segment
    Request:  { "lat": -37.91, "lng": 145.13, "time_of_day": 21 }
    Response: { "safety_score": 65, "factors": { ... } }

    - safety_score: integer 0-100 (higher = safer)
    - factors: optional dict with score breakdown (for debugging/display)
    - time_of_day: integer 0-23

How to build the ML model:

    1. Create backend/app/services/ml_scoring_engine.py
    2. Implement this exact function signature:

        def score_segment(lat: float, lng: float, time_of_day: int) -> dict:
            return {"safety_score": int, "factors": dict | None}

    3. Work on a separate branch (e.g. feature/ml-scorer)
    4. When ready, we swap the import by setting SCORING_ENGINE=ml in .env

The mock scorer is at backend/app/services/scoring_engine.py -- read it to understand the current logic and interface.

Test your endpoint:

    curl -X POST http://localhost:8000/api/score-segment \
      -H "Content-Type: application/json" \
      -d '{"lat": -37.9105, "lng": 145.1340, "time_of_day": 21}'

Mock data files for reference (in backend/app/mock_data/):

    - crime_data.json: 200 crime incidents around Monash Clayton
    - lighting_data.json: 150 street light locations
    - sample_routes.json: 3 walking routes (campus to station)


Tech Stack

    - Backend: Python, FastAPI
    - Frontend: Next.js, React, TypeScript, Tailwind CSS
    - Maps: Google Maps JavaScript API
    - Database: PostgreSQL + PostGIS (via Docker)
    - Scoring: Mock weighted rules (crime density, lighting, time of day), swappable with ML model
