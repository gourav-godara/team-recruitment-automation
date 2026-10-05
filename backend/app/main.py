from fastapi import FastAPI

app = FastAPI(
    title="Team Recruitment Automation Tool",
    description="Configurable and explainable team shortlisting engine",
    version="0.1.0",
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "team-recruitment-automation",
    }
