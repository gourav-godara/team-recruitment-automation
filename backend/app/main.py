from fastapi import FastAPI

from backend.app.api.scoring import router as scoring_router

app = FastAPI(
    title="Team Recruitment Automation Tool",
    description="Configurable, explainable, and reproducible team shortlisting decision engine",
    version="0.1.0",
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "team-recruitment-automation",
    }


app.include_router(
    scoring_router,
    prefix="/api/v1/scoring",
    tags=["scoring"],
)
