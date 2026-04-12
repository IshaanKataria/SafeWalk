import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import heatmap, reports, routes, scoring

app = FastAPI(title="SafeWalk API", version="0.1.0")

# ALLOWED_ORIGINS is a comma-separated list of full origins. It falls back
# to the common dev/test origins (localhost + any cloudflared tunnel) plus
# any Vercel preview/production URL if not set.
_extra_origins = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip()]
_default_origins = ["http://localhost:3000"]
_allowed_origins = _default_origins + _extra_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_origin_regex=r"https://.*\.trycloudflare\.com|https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scoring.router)
app.include_router(routes.router)
app.include_router(reports.router)
app.include_router(heatmap.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
