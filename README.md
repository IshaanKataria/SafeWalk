SafeWalk

Score any walking route for safety at any time of day using real crime data, street lighting, public transport coverage, and community reports.

Built for Macathon 2026. Demo area: Barnet (Hendon / Golders Green), North London.

Live: https://frontend-topaz-pi-18.vercel.app


The Problem

Every night theres students leaving late lectures, shift workers finishing after midnight, and people catching the last train all doing the same silent calculation: is this route safe? Right now that decision relies entirely on gut feel. Theres no tool that tells u the stretch of footpath ahead is unlit, that foot traffic drops off at 9pm, or that a reported hotspot sits two blocks from your shortcut. The data exists, its just never been assembled into something useful at the moment it matters most.

SafeWalk fixes that.


How It Works

Enter a start point, destination, and time of day. SafeWalk returns multiple walking routes, each split into street-level segments and colour-coded green (safe), yellow (moderate), or red (avoid). Scores come from an XGBoost model trained on real UK crime data, street lighting density, public transport proximity, and community reports. A toggleable heatmap shows safety across the whole area at a glance. Users can flag locations that feel unsafe and those reports immediately feed back into the scoring so nearby route scores drop in real time.

Pick the safest route, tap Navigate, and it opens Google Maps walking directions on your phone.


Prerequisites

    Docker Desktop (for local PostgreSQL + PostGIS)
    Node.js 18+ and npm
    Python 3.11+ and uv (https://docs.astral.sh/uv/)
    Git


Quick Setup

    git clone https://github.com/IshaanKataria/SafeWalk.git
    cd SafeWalk
    ./scripts/setup.sh

Then add the Google Maps API key to frontend/.env.local (see step 6 below) and start both dev servers:

    Terminal 1:
    cd backend && source .venv/bin/activate && uvicorn app.main:app --reload

    Terminal 2:
    cd frontend && npm run dev

Open http://localhost:3000


Manual Setup

1. Clone the repo

    git clone https://github.com/IshaanKataria/SafeWalk.git
    cd SafeWalk

2. Environment variables

    cp .env.example .env

    The app works with real London data by default. No API keys needed for the scoring engine. If u want real Google Maps walking directions instead of cached sample routes, add your key to .env.

3. Start the database

    docker compose up -d

    Starts PostgreSQL + PostGIS on port 5433. Make sure Docker Desktop is running first.

4. Backend

    cd backend
    uv venv && uv pip install -r requirements.txt
    source .venv/bin/activate
    alembic upgrade head
    python seed_data.py
    uvicorn app.main:app --reload

    Runs on http://localhost:8000
    Health check: http://localhost:8000/api/health

5. Frontend

    cd frontend
    npm install
    npm run dev

    Runs on http://localhost:3000
    API calls proxy to the backend automatically.

6. Google Maps API key (required for the map to render)

    The key isnt stored in the repo. Create frontend/.env.local with:

        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=ask_ishaan_for_the_key

    Ask the project owner for the key. If u want your own, create one at https://console.cloud.google.com:
        Enable Maps JavaScript API, Directions API, Places API
        Credentials -> Create Credentials -> API Key

    After adding the key, restart the frontend.


Architecture

    User input (origin, destination, time)
            |
            v
    Next.js frontend  ------>  FastAPI backend  ------>  Supabase PostgreSQL + PostGIS
    (React, Tailwind)           (routing, scoring)        (community reports, geospatial)
    deployed on Vercel          deployed on Railway
            ^                           |
            |                           v
            +-------- routes --- XGBoost scoring engine
                                        |
                                        v
                            Crime + lighting + transport data
                            (6425 crimes, 7681 lights, 478 stops)

The scoring engine is hot-swappable. One env var (SCORING_ENGINE=ml or SCORING_ENGINE=mock) switches between the trained XGBoost model and the rule-based fallback without touching any code. The frontend never needs to change when the model improves.

The heatmap grid covers 360 points and is computed lazily per time-of-day. First request takes about a second, everything after that is cached and instant.

Community reports live in PostGIS and get pulled into the scoring engine at the start of every route request, so flagging an unsafe spot immediately affects future route scores.


Project Structure

    SafeWalk/
    ├── backend/                FastAPI + PostGIS
    │   ├── app/
    │   │   ├── main.py            API entry, CORS, router mounting
    │   │   ├── config.py          Settings from .env
    │   │   ├── database.py        SQLAlchemy engine + session
    │   │   ├── routers/           scoring, routes, reports, heatmap
    │   │   ├── services/          scoring_engine, ml_scoring_engine, scorer_selector,
    │   │   │                      route_scorer, google_maps, data_loader, ml_features
    │   │   ├── models/            PostGIS geometry models
    │   │   ├── schemas/           Pydantic request/response models
    │   │   ├── models_ml/         Trained XGBoost model (.pkl)
    │   │   ├── data/              Real London data (crime, lighting, transport, routes)
    │   │   └── mock_data/         Synthetic Clayton data (fallback)
    │   ├── alembic/               Database migrations
    │   ├── seed_data.py           Demo community reports
    │   └── Dockerfile             Production container
    ├── frontend/               Next.js + Tailwind
    │   └── src/
    │       ├── app/               Pages, layout, globals
    │       ├── components/        MapView, RouteForm, RoutePanel, HeatmapLayer,
    │       │                      ReportMarkers, ReportModal, ReportButton,
    │       │                      PlaceAutocomplete, SafetyLegend, HeatmapLegend,
    │       │                      InfoTooltip, Spinner
    │       ├── hooks/             useRoutes, useReports, useHeatmap
    │       ├── lib/               api, colors, gmaps
    │       └── types/             TypeScript interfaces
    ├── scripts/
    │   ├── setup.sh               One-command local setup
    │   ├── download_london_data.py    Fetch real data from UK Police + OSM
    │   ├── generate_sample_routes.py  Generate road-following routes via Directions API
    │   └── train_ml_scorer.py         Train XGBoost model via knowledge distillation
    ├── docker-compose.yml         Local PostGIS container
    └── .env.example               Config template


Tech Stack

    Backend:       Python, FastAPI, SQLAlchemy, GeoAlchemy2, Alembic
    Frontend:      Next.js 16, React, TypeScript, Tailwind CSS
    ML:            XGBoost, scikit-learn, NumPy, joblib
    Maps:          Google Maps JavaScript API, Directions API, Places API
    Database:      PostgreSQL + PostGIS 3.3 (Supabase in prod, Docker locally)
    Hosting:       Vercel (frontend), Railway (backend), Supabase (database)
    Data:          data.police.uk, OpenStreetMap Overpass API


Scoring Model

The XGBoost regressor is trained on 8 features extracted from real London data:

    crime_count          crimes within 300m
    crime_severity_total sum of severity scores within 300m
    light_count          street lights within 200m
    transport_count      bus stops and stations within 250m
    hour                 hour of day (0-23)
    hour_sin             sin(2pi * hour/24) for cyclical encoding
    hour_cos             cos(2pi * hour/24) for cyclical encoding
    is_dark              1 if hour >= 19 or hour < 6

Training uses knowledge distillation from the rule-based scorer on 8000 random samples across the Barnet bounding box. Test MAE is 0.47 points on a 0-100 scale with R² = 0.9975.

Feature importance (learned by the model):
    is_dark                 60.2%
    hour_cos                17.6%
    crime_severity_total     5.6%
    transport_count          5.3%
    light_count              4.1%
    crime_count              3.0%
    hour_sin                 2.1%
    hour                     2.0%

To retrain:

    cd backend && source .venv/bin/activate
    python ../scripts/train_ml_scorer.py


API Endpoints

    GET  /api/health              Health check
    POST /api/score-segment       Score a single point for safety
    POST /api/routes              Get scored walking routes between two locations
    GET  /api/reports             List all community reports
    POST /api/reports             Submit a new community report
    GET  /api/reports/nearby      Get reports within a radius
    GET  /api/heatmap             Get safety heatmap grid for a time of day


Scoring Endpoint Contract

    POST /api/score-segment
    Request:  { "lat": 51.5828, "lng": -0.2268, "time_of_day": 21 }
    Response: { "safety_score": 56, "factors": { ... } }

    safety_score: integer 0-100 (higher = safer)
    factors: dict with score breakdown and model metadata
    time_of_day: integer 0-23


Data

All real data ships with the repo in backend/app/data/ so the app runs without any external API calls:

    crime_data_london.json       6,425 UK Police crime incidents (6 months, Barnet area)
    lighting_data_london.json    7,681 street lights
    transport_data_london.json   478 bus stops, train stations, tube entrances
    sample_routes_london.json    3 real walking routes (Hendon Central to Golders Green)

To refresh the data from source:

    python scripts/download_london_data.py
    python scripts/generate_sample_routes.py


Deployment

The app is deployed and live:

    Frontend:  https://frontend-topaz-pi-18.vercel.app (Vercel)
    Backend:   https://backend-production-fe29.up.railway.app (Railway)
    Database:  Supabase PostgreSQL + PostGIS 3.3 (Asia-Pacific)

To deploy your own:
    1. Create a Supabase project, enable PostGIS, run alembic upgrade head against it
    2. Deploy backend/ to Railway with the Dockerfile, set DATABASE_URL + SCORING_ENGINE=ml + DATA_SOURCE=london + GOOGLE_MAPS_API_KEY
    3. Deploy frontend/ to Vercel, set NEXT_PUBLIC_API_URL to your Railway URL + NEXT_PUBLIC_GOOGLE_MAPS_API_KEY


Future Scope

    Richer data: pubs, CCTV, pedestrian crossings, vegetation sightlines
    Multi-city expansion using open crime data APIs (UK, US, Australia, Europe)
    Government and council partnerships for street-level lighting data
    User feedback loop: upvote/downvote scores to generate real training labels
    Real-time foot traffic from transit APIs and phone density
    Emergency SOS with auto-location sharing
    Cycling and accessibility route scoring
    On-device ML for offline operation
