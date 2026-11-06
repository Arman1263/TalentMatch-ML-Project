from app.services.ml.preprocessing import clean_text
from app.services.ml.skill_extractor import extract_skills
from app.services.ml.matching_engine import (
    calculate_skills_match,
    calculate_tfidf_similarity,
    calculate_hybrid_score,
)

from app.services.ml.matching_engine import match_resume_to_job

def test_clean_text():
    result = clean_text(
        "Python Developer\nEmail: test@example.com"
    )

    assert result == "python developer email"


def test_extract_skills():
    result = extract_skills(
        "Python developer using Postgres, RESTful APIs and ML."
    )

    assert result == [
        "Machine Learning",
        "PostgreSQL",
        "Python",
        "REST API",
    ]


def test_calculate_skills_match():
    result = calculate_skills_match(
        ["Python", "FastAPI", "PostgreSQL"],
        ["Python", "FastAPI", "AWS"],
    )

    assert result["score"] == 66.67
    assert result["matched_skills"] == ["FastAPI", "Python"]
    assert result["missing_skills"] == ["AWS"]


def test_tfidf_similarity():
    score = calculate_tfidf_similarity(
        "Python developer with FastAPI experience",
        "Looking for a Python developer with FastAPI skills",
    )

    assert 0 <= score <= 100
    assert score > 0


def test_hybrid_score():
    score = calculate_hybrid_score(
        tfidf_score=80,
        semantic_score=90,
        skills_score=70,
    )

    assert score == 81.5


def test_match_resume_to_job():
    result = match_resume_to_job(
        resume_text=(
            "Python developer experienced with FastAPI, "
            "PostgreSQL, Docker and RESTful APIs."
        ),
        job_description=(
            "Looking for a Python developer skilled in "
            "FastAPI, Postgres, AWS and Machine Learning."
        ),
        required_skills=["Python", "FastAPI", "Postgres", "AWS"],
    )

    assert 0 <= result["matching_score"] <= 100
    assert result["matched_skills"] == [
        "FastAPI", "PostgreSQL", "Python"
    ]
    assert result["missing_skills"] == [
        "AWS", "Machine Learning"
    ]