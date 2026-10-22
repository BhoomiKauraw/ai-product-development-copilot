
import pytest
from pydantic import ValidationError

from app.rice import FeatureInput, calculate_rice, rank_features


def test_calculate_rice_score():
    feature = FeatureInput(
        name="Skill matching",
        reach=200,
        impact=3,
        confidence=80,
        effort=2,
    )

    result = calculate_rice(feature)

    assert result["score"] == 240


def test_features_are_ranked_highest_first():
    features = [
        FeatureInput(
            name="Theme customization",
            reach=100,
            impact=0.5,
            confidence=90,
            effort=1,
        ),
        FeatureInput(
            name="Skill matching",
            reach=200,
            impact=3,
            confidence=80,
            effort=2,
        ),
    ]

    results = rank_features(features)

    assert results[0]["name"] == "Skill matching"
    assert results[0]["rank"] == 1
    assert results[1]["rank"] == 2


def test_zero_effort_is_rejected():
    with pytest.raises(ValidationError):
        FeatureInput(
            name="Invalid feature",
            reach=100,
            impact=1,
            confidence=80,
            effort=0,
        )


def test_blank_feature_name_is_rejected():
    with pytest.raises(ValidationError):
        FeatureInput(
            name="   ",
            reach=100,
            impact=1,
            confidence=80,
            effort=1,
        )
