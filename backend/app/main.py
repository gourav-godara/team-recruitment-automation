from fastapi import FastAPI
from backend.app.api.auth import router as auth_router
from backend.app.api.campaigns import router as campaigns_router
from backend.app.api.evaluations import router as evaluations_router
from backend.app.api.exports import router as exports_router
from backend.app.api.github import router as github_router
from backend.app.api.imports import router as imports_router
from backend.app.api.scoring import router as scoring_router
from backend.app.core.database import init_db

app = FastAPI(
    title="Team Recruitment Automation Tool",
    description="Configurable, explainable, and reproducible team shortlisting decision engine",
    version="2.0.0",
)


@app.on_event("startup")
def on_startup():
    init_db()


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

app.include_router(
    imports_router,
    prefix="/api/v1/imports",
    tags=["imports"],
)

app.include_router(
    evaluations_router,
    prefix="/api/v1/evaluations",
    tags=["evaluations"],
)

app.include_router(
    exports_router,
    prefix="/api/v1/exports",
    tags=["exports"],
)

app.include_router(
    github_router,
    prefix="/api/v1/github",
    tags=["github"],
)

app.include_router(
    campaigns_router,
    prefix="/api/v1/campaigns",
    tags=["campaigns"],
)

app.include_router(
    auth_router,
    prefix="/api/v1/auth",
    tags=["auth"],
)
