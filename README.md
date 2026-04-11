SafeWalk -- Walking Route Safety Scorer

Score any walking route for safety at any time of day using real crime data, street lighting density, public transport coverage, and community reports.

Built for Macathon 2026. Demo area: Wandsworth, London.


The Problem

1 in 3 women feel unsafe walking at night in their own neighbourhood. Every student walking home from a late lecture, every shift worker heading to the train, every person walking somewhere unfamiliar does the same mental calculation: "is this route safe?" There's no data. Just gut feel and hope.

SafeWalk answers that question with real data, before you walk.


How It Works

Enter a start, destination, and time of day. SafeWalk returns 2-3 walking routes, each split into segments and colour-coded (green / yellow / red) based on a safety score computed from:

    - Historical crime incidents in the area (UK Police data)
    - Street lighting density (OpenStreetMap)
    - Proximity to public transport stops (busier = safer)
    - Community-reported unsafe locations
    - Time of day (dusk, night, and late-night penalties)

The safest route is recommended. A toggleable heatmap shows safety across the entire neighbourhood at a glance. Users can flag their own unsafe locations, which persist in the database and immediately affect future route scores.


Prerequisites

    - Docker Desktop (for PostgreSQL + PostGIS)
    - Node.js 18+ and npm
    - Python 3.11+ and uv (https://docs.astral.sh/uv/)
    - Git


Quick Setup (one command)

    git clone https://github.com/IshaanKataria/SafeWalk.git
    cd SafeWalk
    ./scripts/setup.sh

Then add the Google Maps API key to frontend/.env.local (see step 6 below), and start the two dev servers:

    # Terminal 1
    cd backend && source .venv/bin/activate && uvicorn app.main:app --reload

    # Terminal 2
    cd frontend && npm run dev

Open http://localhost:3000


Manual Setup (if the script doesn't work)

1. Clone the repo

    git clone https://github.com/IshaanKataria/SafeWalk.git
    cd SafeWalk

2. Environment variables

    cp .env.example .env

    The app works with real London data by default -- no API keys needed for the scoring engine. To enable real Google Maps walking directions (instead of the cached sample routes), add your key to .env and set USE_MOCK_DATA=false.

3. Start the database

    docker compose up -d

    This starts PostgreSQL + PostGIS on port 5433. Make sure Docker Desktop is running first.

4. Backend

    cd backend
    uv venv && uv pip install -r requirements.txt
    source .venv/bin/activate
    alembic upgrade head
    python seed_data.py        # optional: adds demo community reports
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

    Ask the project owner for the key. It is restricted to localhost, so safe to share within the team.

    If you prefer to use your own, create one at https://console.cloud.google.com:
        - Enable: Maps JavaScript API, Directions API, Places API
        - Credentials -> Create Credentials -> API Key

    After adding the key, restart the frontend (Ctrl+C then npm run dev again).


Architecture

    User input (origin, destination, time)
            |
            v
    Next.js frontend  ------>  FastAPI backend  ------>  PostgreSQL + PostGIS
    (React, Tailwind)           (routing, scoring)        (community reports)
            ^                           |
            |                           v
            +-------- routes --- Scoring engine
                                        |
                                        v
                            Crime + lighting + transport data
                            (cached JSON, real London sources)

Key architectural decisions:

    - Scoring is a pure function with a stable interface -- the mock engine and
      the ML engine are hot-swappable via an env var, so the frontend never
      needs to change when the model improves.
    - Heatmap grid is computed lazily and cached in memory per time-of-day so
      the first request is slow but every subsequent request is instant.
    - Community reports live in PostGIS and are pulled into the scoring
      engine's cache at the start of every route request, so flagging an
      unsafe spot immediately affects future route scores.


Project Structure

    SafeWalk/
    ├── backend/               FastAPI + PostGIS
    │   ├── app/
    │   │   ├── main.py           API entry, CORS, router mounting
    │   │   ├── config.py         Settings from .env
    │   │   ├── database.py       SQLAlchemy engine + session
    │   │   ├── routers/          API endpoints
    │   │   ├── services/         Scoring engine, route scorer, data loader
    │   │   ├── models/           PostGIS geometry models
    │   │   ├── schemas/          Pydantic request/response models
    │   │   ├── data/             Real London data (crime, lighting, transport)
    │   │   └── mock_data/        Synthetic Clayton data (fallback)
    │   ├── alembic/              Database migrations
    │   └── seed_data.py          Demo community reports
    ├── frontend/              Next.js + Tailwind
    │   └── src/
    │       ├── app/              Pages and layout
    │       ├── components/       MapView, RouteForm, RoutePanel, heatmap, reports
    │       ├── hooks/            useRoutes, useReports, useHeatmap
    │       ├── lib/              API wrapper, colour utilities
    │       └── types/            TypeScript interfaces
    ├── scripts/
    │   ├── setup.sh                       One-command setup
    │   ├── download_london_data.py        Refresh real London data from sources
    │   └── generate_sample_routes.py      Regenerate road-following sample routes
    ├── docker-compose.yml        PostGIS container
    └── .env.example              Config template


Tech Stack

    Backend:       Python, FastAPI, SQLAlchemy, GeoAlchemy2, Alembic
    Frontend:      Next.js 16, React, TypeScript, Tailwind CSS
    Maps:          Google Maps JavaScript API, Directions API, Places API
    Database:      PostgreSQL 16 + PostGIS 3.4 (via Docker)
    Data sources:  data.police.uk (UK crime), OpenStreetMap Overpass API
    Scoring:       Weighted rule-based engine, swappable with ML model


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
    Request:  { "lat": 51.4572, "lng": -0.19, "time_of_day": 21 }
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
      -d '{"lat": 51.4572, "lng": -0.19, "time_of_day": 21}'

Real data files to train on (in backend/app/data/):

    - crime_data_london.json:     ~9900 UK Police crime incidents (6 months)
    - lighting_data_london.json:  OpenStreetMap street lamps
    - transport_data_london.json: Bus stops, train stations, tube entrances


Future Scope

    - Integration with university or campus security systems
    - Real-time foot traffic from phone density / transit data
    - Emergency SOS button with auto-location sharing
    - Council partnerships for lighting improvement data
    - Expansion to cycling and mobility-aid accessible routes
    - On-device ML inference for fully offline operation
