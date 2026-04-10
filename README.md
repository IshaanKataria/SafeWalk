SafeWalk -- Walking Route Safety Scorer

Score any walking route for safety at any time of day using street lighting density, crime data, and community reports.

Built for Macathon 2026.


Quick Setup

1. Start the database

    docker compose up -d

2. Backend

    cd backend
    uv venv && uv pip install -r requirements.txt
    source .venv/bin/activate
    alembic upgrade head
    uvicorn app.main:app --reload

    Runs on http://localhost:8000
    Health check: http://localhost:8000/api/health

3. Frontend

    cd frontend
    npm install
    npm run dev

    Runs on http://localhost:3000
    API calls proxy to the backend automatically.

4. Environment variables

    Copy .env.example to .env in the project root. The app works out of the box with mock data -- no API keys needed.


Project Structure

    SafeWalk/
    ├── backend/          FastAPI + PostGIS
    │   ├── app/
    │   │   ├── main.py
    │   │   ├── routers/
    │   │   ├── services/
    │   │   ├── models/
    │   │   ├── schemas/
    │   │   └── mock_data/
    │   └── alembic/
    └── frontend/         Next.js + Tailwind
        └── src/
            ├── app/
            ├── components/
            ├── hooks/
            └── lib/


Scoring Endpoint (for ML team)

    POST /api/score-segment
    Request:  { "lat": -37.91, "lng": 145.13, "time_of_day": 21 }
    Response: { "safety_score": 65, "factors": { ... } }

This is the stable contract. The mock scorer runs by default. To swap in the ML model, set SCORING_ENGINE=ml in .env.
