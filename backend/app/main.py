from contextlib import asynccontextmanager
from fastapi import FastAPI
from backend.app.api.campaigns import router as campaigns_router
from backend.app.api.evaluations import router as evaluations_router
from backend.app.api.exports import router as exports_router
from backend.app.api.github import router as github_router
from backend.app.api.imports import router as imports_router
from backend.app.api.rules import router as rules_router
from backend.app.api.scoring import router as scoring_router
from backend.app.api.session import router as session_router
from backend.app.core.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Team Recruitment Automation Tool",
    description="Configurable, explainable, and reproducible team shortlisting decision engine",
    version="2.0.0",
    lifespan=lifespan,
)

# Enable CORS for local frontend development (Next.js, Vite, React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    rules_router,
    prefix="/api/v1/rules",
    tags=["rules"],
)

app.include_router(
    session_router,
    prefix="/api/v1/session",
    tags=["session"],
)
