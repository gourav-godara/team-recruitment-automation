import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_scoring_evaluate_endpoint():
    payload = {
        "teams": [
            {
                "team_id": "T1",
                "name": "Team One",
                "members": [
                    {
                        "member_id": "M1",
                        "signals": {
                            "projects": 5,
                            "github": 80,
                        },
                    }
                ],
            },
            {
                "team_id": "T2",
                "name": "Team Two",
                "members": [
                    {
                        "member_id": "M2",
                        "signals": {
                            "projects": 2,
                            "github": 20,
                        },
                    }
                ],
            },
        ],
        "config": {
            "top_x": 1,
            "weights": {
                "projects": 0.5,
                "github": 0.5,
            },
            "eligibility_rules": [
                {
                    "name": "Minimum projects",
                    "scope": "MEMBER",
                    "field": "projects",
                    "operator": ">=",
                    "value": 3,
                    "aggregation": "ANY",
                }
            ],
        },
    }

    response = client.post("/api/v1/scoring/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["total_teams"] == 2
    assert data["shortlisted_teams"] == 1
    assert data["rejected_teams"] == 1
    assert "run_id" in data
    assert "dataset_hash" in data
    assert "config_hash" in data

    # T1 should be shortlisted (projects=5 >= 3)
    # T2 should be rejected (projects=2 < 3)
    t1_res = next(r for r in data["results"] if r["team_id"] == "T1")
    t2_res = next(r for r in data["results"] if r["team_id"] == "T2")

    assert t1_res["status"] == "SHORTLISTED"
    assert t1_res["rank"] == 1
    assert t1_res["score"] == 42.5  # 5 * 0.5 + 80 * 0.5 = 2.5 + 40 = 42.5

    assert t2_res["status"] == "REJECTED"
    assert t2_res["rank"] is None
    assert t2_res["eligibility"]["status"] == "FAIL"


def test_scoring_evaluate_invalid_weights():
    payload = {
        "teams": [{"team_id": "T1", "members": []}],
        "config": {
            "weights": {"projects": -1.0},
        },
    }
    response = client.post("/api/v1/scoring/evaluate", json=payload)
    assert response.status_code == 422  # Pydantic validation error


def test_scoring_evaluate_duplicate_team_ids_via_api():
    payload = {
        "teams": [
            {"team_id": "DUP_1", "members": []},
            {"team_id": "DUP_1", "members": []},
        ],
        "config": {"weights": {"projects": 1.0}},
    }
    response = client.post("/api/v1/scoring/evaluate", json=payload)
    assert response.status_code == 422
    assert "Duplicate team_id" in response.text


def test_scoring_evaluate_invalid_top_x_via_api():
    payload = {
        "teams": [{"team_id": "T1", "members": []}],
        "config": {"weights": {"projects": 1.0}, "top_x": 0},
    }
    response = client.post("/api/v1/scoring/evaluate", json=payload)
    assert response.status_code == 422
    assert "positive integer > 0" in response.text


def test_scoring_evaluate_out_of_bounds_score_via_api():
    payload = {
        "teams": [
            {
                "team_id": "T1",
                "members": [{"member_id": "M1", "signals": {"projects": 150.0}}],
            }
        ],
        "config": {"weights": {"projects": 1.0}},
    }
    response = client.post("/api/v1/scoring/evaluate", json=payload)
    assert response.status_code == 400
    assert "between 0 and 100" in response.json()["detail"]["message"]


def test_rules_catalog_endpoints():
    res_types = client.get("/api/v1/rules/types")
    assert res_types.status_code == 200
    assert len(res_types.json()) > 0

    res_cat = client.get("/api/v1/rules/catalog")
    assert res_cat.status_code == 200
    assert res_cat.json() == res_types.json()


def test_scoring_with_between_operator():
    payload = {
        "teams": [
            {
                "team_id": "T1",
                "team_signals": {"team_size": 3},
                "members": [{"member_id": "M1", "signals": {"projects": 50.0}}],
            },
            {
                "team_id": "T2",
                "team_signals": {"team_size": 6},
                "members": [{"member_id": "M2", "signals": {"projects": 80.0}}],
            },
        ],
        "config": {
            "top_x": 2,
            "weights": {"projects": 1.0},
            "eligibility_rules": [
                {
                    "name": "Team Size Range",
                    "scope": "TEAM",
                    "field": "team_size",
                    "operator": "BETWEEN",
                    "value": [2, 4],
                }
            ],
        },
    }
    res = client.post("/api/v1/scoring/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()
    t1 = next(r for r in data["results"] if r["team_id"] == "T1")
    t2 = next(r for r in data["results"] if r["team_id"] == "T2")
    assert t1["status"] == "SHORTLISTED"
    assert t2["status"] == "REJECTED"


def test_upload_csv_with_sqlite_persistence():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool
    from backend.app.models.entities import Base
    from backend.app.core.database import get_db

    sqlite_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=sqlite_engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=sqlite_engine)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
            db.commit()
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    try:
        csv_content = """team_id,team_name,name,email,experience_years,skills
T101,Binary Bosses,Alice,alice@example.com,4.5,"Python, Docker"
T101,Binary Bosses,Bob,bob@example.com,3.0,"FastAPI, React"
T102,Neural Ninjas,Charlie,charlie@example.com,2.0,"PyTorch"
"""
        res = client.post(
            "/api/v1/imports?filename=sample_test.csv&persist=true",
            content=csv_content.encode("utf-8"),
            headers={"Content-Type": "text/csv"},
        )
        assert res.status_code == 201
        data = res.json()
        assert data["status"] == "success"
        assert data["total_teams"] == 2
        assert data["valid_teams_count"] == 2
        assert "import_id" in data
    finally:
        app.dependency_overrides.clear()



