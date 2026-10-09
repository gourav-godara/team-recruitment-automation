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
