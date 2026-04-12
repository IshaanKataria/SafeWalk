FROM python:3.12-slim

# XGBoost on Linux needs OpenMP runtime.
# psycopg2 needs libpq for building.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the full backend tree (app/, alembic/, alembic.ini, seed_data.py, etc.)
COPY . .

# Railway injects PORT env var at runtime.
ENV PORT=8000

# Run migrations + seed, then start the server.
CMD alembic upgrade head && python seed_data.py || true; \
    uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
