
from pydantic import BaseModel, Field, field_validator


class FeatureInput(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    reach: int = Field(ge=0, le=1_000_000)
    impact: float = Field(gt=0, le=3)
    confidence: float = Field(gt=0, le=100)
    effort: float = Field(gt=0, le=10_000)

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Feature name cannot be blank")
        return value


class RiceRequest(BaseModel):
    features: list[FeatureInput] = Field(min_length=1, max_length=50)


def calculate_rice(feature: FeatureInput) -> dict:
    confidence_fraction = feature.confidence / 100

    score = (
        feature.reach
        * feature.impact
        * confidence_fraction
        / feature.effort
    )

    return {
        "name": feature.name,
        "reach": feature.reach,
        "impact": feature.impact,
        "confidence": feature.confidence,
        "effort": feature.effort,
        "score": round(score, 2),
    }


def rank_features(features: list[FeatureInput]) -> list[dict]:
    results = [calculate_rice(feature) for feature in features]

    # Highest RICE score comes first.
    results.sort(key=lambda item: item["score"], reverse=True)

    # Assign ranking after sorting.
    for rank, item in enumerate(results, start=1):
        item["rank"] = rank

    return results
