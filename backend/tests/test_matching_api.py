import pytest

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from fastapi.testclient import TestClient

from app.main import app
from app.core.database import Base, get_db


import uuid
from datetime import datetime, timezone

from app.models import (
    User,
    CandidateProfile,
    RecruiterProfile,
    Resume,
    Job,
    MatchResult,
)
from app.core.security import create_access_token

# In-memory SQLite database
TEST_DATABASE_URL = "sqlite://"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)

TestingSessionLocal = sessionmaker(
    bind=test_engine,
    autoflush=False,
    autocommit=False
)


@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=test_engine)

    db = TestingSessionLocal()

    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()






@pytest.fixture
def test_data(db_session):
    # Create users
    candidate_user = User(
        email="candidate_test@example.com",
        hashed_password="test-hash",
        role="candidate",
        is_active=True,
    )

    recruiter_user = User(
        email="recruiter_test@example.com",
        hashed_password="test-hash",
        role="recruiter",
        is_active=True,
    )

    recruiter2_user = User(
        email="recruiter2_test@example.com",
        hashed_password="test-hash",
        role="recruiter",
        is_active=True,
    )

    db_session.add_all([
        candidate_user,
        recruiter_user,
        recruiter2_user,
    ])
    db_session.flush()

    # Create profiles
    candidate = CandidateProfile(
        user_id=candidate_user.id,
        full_name="Test Candidate",
    )

    recruiter = RecruiterProfile(
        user_id=recruiter_user.id,
        full_name="Test Recruiter",
        company_name="Test Company",
    )

    recruiter2 = RecruiterProfile(
        user_id=recruiter2_user.id,
        full_name="Second Recruiter",
        company_name="Second Company",
    )

    db_session.add_all([candidate, recruiter, recruiter2])
    db_session.flush()

    # Create job
    job = Job(
        recruiter_id=recruiter.id,
        title="Python Developer",
        company_name="Test Company",
        description="Python developer with FastAPI and SQL experience.",
        required_skills=["Python", "FastAPI", "SQL"],
        is_active=True,
    )

    db_session.add(job)
    db_session.flush()

    # Create active resume
    resume = Resume(
        candidate_id=candidate.id,
        file_name="test_resume.pdf",
        file_path="test_resume.pdf",
        extracted_text="Python developer experienced with FastAPI and SQL.",
        is_active=True,
    )

    db_session.add(resume)
    db_session.flush()

    # Create saved matching result
    match = MatchResult(
        candidate_id=candidate.id,
        job_id=job.id,
        resume_id=resume.id,
        matching_score=85.50,
        matched_skills=["Python", "FastAPI"],
        missing_skills=["SQL"],
        recommendations=["Improve SQL skills"],
        created_at=datetime.now(timezone.utc),
    )

    db_session.add(match)
    db_session.commit()

    return {
        "candidate": candidate,
        "recruiter": recruiter,
        "recruiter2": recruiter2,
        "job": job,
        "resume": resume,
        "match": match,
        "candidate_token": create_access_token(str(candidate_user.id)),
        "recruiter_token": create_access_token(str(recruiter_user.id)),
        "recruiter2_token": create_access_token(str(recruiter2_user.id)),
    }


def test_candidate_can_generate_match(client, test_data):
    response = client.post(
        f"/matching/{test_data['job'].id}",
        headers={
            "Authorization": f"Bearer {test_data['candidate_token']}"
        },
    )

    assert response.status_code == 200
    assert response.json()["job_title"] == "Python Developer"
    assert 0 <= response.json()["matching_score"] <= 100


def test_candidate_can_view_match_history(client, test_data):
    response = client.get(
        "/matching/my-matches",
        headers={
            "Authorization": f"Bearer {test_data['candidate_token']}"
        },
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["matching_score"] == 85.5


def test_recruiter_cannot_view_candidate_history(client, test_data):
    response = client.get(
        "/matching/my-matches",
        headers={
            "Authorization": f"Bearer {test_data['recruiter_token']}"
        },
    )

    assert response.status_code == 403


def test_recruiter_can_view_job_candidates(client, test_data):
    response = client.get(
        f"/matching/job/{test_data['job'].id}/candidates",
        headers={
            "Authorization": f"Bearer {test_data['recruiter_token']}"
        },
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["candidate_name"] == "Test Candidate"
    assert response.json()[0]["matching_score"] == 85.5


def test_recruiter_cannot_view_another_recruiters_candidates(
    client, test_data
):
    response = client.get(
        f"/matching/job/{test_data['job'].id}/candidates",
        headers={
            "Authorization": f"Bearer {test_data['recruiter2_token']}"
        },
    )

    assert response.status_code == 404


def test_unauthenticated_user_cannot_access_matching(client, test_data):
    response = client.get("/matching/my-matches")

    assert response.status_code == 401