from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import routes, scoring

app = FastAPI(title="SafeWalk API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scoring.router)
app.include_router(routes.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
