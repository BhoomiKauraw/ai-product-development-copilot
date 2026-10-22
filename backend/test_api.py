from fastapi.testclient import TestClient
from unittest.mock import patch

from app.main import app


client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok" or (
        isinstance(response.json()["status"], str)
        and "running" in response.json()["status"].lower()
    )


def test_rice_endpoint_returns_ranked_results():
    payload = {
        "features": [
            {
                "name": "Feature A",
                "reach": 200,
                "impact": 3,
                "confidence": 80,
                "effort": 2,
            },
            {
                "name": "Feature B",
                "reach": 150,
                "impact": 2,
                "confidence": 70,
                "effort": 1.5,
            },
        ]
    }

    response = client.post("/api/rice", json=payload)

    assert response.status_code == 200

    results = response.json()["results"]

    assert len(results) == 2
    assert results[0]["name"] == "Feature A"
    assert results[0]["score"] == 240
    assert results[0]["rank"] == 1
    assert results[1]["name"] == "Feature B"
    assert results[1]["score"] == 140
    assert results[1]["rank"] == 2


def test_rice_endpoint_rejects_zero_effort():
    payload = {
        "features": [
            {
                "name": "Invalid Feature",
                "reach": 100,
                "impact": 2,
                "confidence": 80,
                "effort": 0,
            }
        ]
    }

    response = client.post("/api/rice", json=payload)

    assert response.status_code == 422


def test_rice_endpoint_rejects_empty_feature_list():
    response = client.post(
        "/api/rice",
        json={"features": []},
    )

    assert response.status_code == 422
def test_prd_history_endpoint_returns_list():
    response = client.get("/api/prds")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_prd_generation_handles_missing_api_key():
    with patch(
        "app.main.generate_prd_content",
        side_effect=RuntimeError("GEMINI_API_KEY is missing"),
    ):
        response = client.post(
            "/api/prd",
            json={"idea": "A platform for students to find project teammates"},
        )

    assert response.status_code == 500
    assert "GEMINI_API_KEY is missing" in response.json()["detail"]


def test_prd_generation_handles_ai_provider_failure():
    with patch(
        "app.main.generate_prd_content",
        side_effect=RuntimeError("Simulated provider failure"),
    ):
        response = client.post(
            "/api/prd",
            json={"idea": "A platform for students to find project teammates"},
        )

    assert response.status_code == 502
    assert response.json()["detail"] == (
        "The AI provider could not generate a response."
    )


def test_prd_generation_rejects_missing_idea():
    response = client.post("/api/prd", json={})

    assert response.status_code == 422
