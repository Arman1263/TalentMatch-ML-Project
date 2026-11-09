
import io
import pytest

from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.core.security import create_access_token
from app.models import User, CandidateProfile, RecruiterProfile, Resume
from pathlib import Path


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
    candidate_user = User(
        email="resume_candidate@test.com",
        hashed_password="test-hash",
        role="candidate",
        is_active=True
    )

    recruiter_user = User(
        email="resume_recruiter@test.com",
        hashed_password="test-hash",
        role="recruiter",
        is_active=True
    )

    db_session.add_all([candidate_user, recruiter_user])
    db_session.flush()

    candidate = CandidateProfile(
        user_id=candidate_user.id,
        full_name="Test Candidate"
    )

    recruiter = RecruiterProfile(
        user_id=recruiter_user.id,
        full_name="Test Recruiter",
        company_name="Test Company"
    )

    db_session.add_all([candidate, recruiter])
    db_session.commit()

    return {
        "candidate": candidate,
        "candidate_token": create_access_token(str(candidate_user.id)),
        "recruiter_token": create_access_token(str(recruiter_user.id))
    }


def test_candidate_can_upload_valid_pdf(client, test_data):
    pdf_content = b"%PDF-1.4 fake pdf content"

    with patch(
        "app.api.resumes.extract_resume_text",
        return_value="Python developer with FastAPI experience."
    ):
        response = client.post(
            "/resumes/upload",
            headers={
                "Authorization": f"Bearer {test_data['candidate_token']}"
            },
            files={
                "file": (
                    "resume.pdf",
                    io.BytesIO(pdf_content),
                    "application/pdf"
                )
            }
        )

    assert response.status_code == 200
    assert response.json()["message"] == "Resume uploaded successfully"

    resume = client.get("/candidates/me/resumes", headers={
        "Authorization": f"Bearer {test_data['candidate_token']}"
    })

    assert resume.status_code == 200


def test_candidate_cannot_upload_unsupported_file(client, test_data):
    response = client.post(
        "/resumes/upload",
        headers={
            "Authorization": f"Bearer {test_data['candidate_token']}"
        },
        files={
            "file": (
                "resume.txt",
                io.BytesIO(b"Some text"),
                "text/plain"
            )
        }
    )

    assert response.status_code == 400


def test_candidate_cannot_upload_empty_file(client, test_data):
    response = client.post(
        "/resumes/upload",
        headers={
            "Authorization": f"Bearer {test_data['candidate_token']}"
        },
        files={
            "file": (
                "resume.pdf",
                io.BytesIO(b""),
                "application/pdf"
            )
        }
    )

    assert response.status_code == 400


def test_candidate_cannot_upload_invalid_pdf(client, test_data):
    response = client.post(
        "/resumes/upload",
        headers={
            "Authorization": f"Bearer {test_data['candidate_token']}"
        },
        files={
            "file": (
                "resume.pdf",
                io.BytesIO(b"Invalid PDF content"),
                "application/pdf"
            )
        }
    )

    assert response.status_code == 400


def test_candidate_cannot_upload_file_larger_than_5mb(client, test_data):
    large_content = b"%PDF-" + (b"A" * (5 * 1024 * 1024 + 1))

    response = client.post(
        "/resumes/upload",
        headers={
            "Authorization": f"Bearer {test_data['candidate_token']}"
        },
        files={
            "file": (
                "large_resume.pdf",
                io.BytesIO(large_content),
                "application/pdf"
            )
        }
    )

    assert response.status_code == 400


def test_recruiter_cannot_upload_resume(client, test_data):
    response = client.post(
        "/resumes/upload",
        headers={
            "Authorization": f"Bearer {test_data['recruiter_token']}"
        },
        files={
            "file": (
                "resume.pdf",
                io.BytesIO(b"%PDF-1.4 fake pdf content"),
                "application/pdf"
            )
        }
    )

    assert response.status_code == 403



def test_failed_upload_does_not_deactivate_existing_resume(
    client, test_data, db_session
):
    # Create an existing active resume
    existing_resume = Resume(
        candidate_id=test_data["candidate"].id,
        file_name="old_resume.pdf",
        file_path="old_resume.pdf",
        extracted_text="Existing resume content",
        is_active=True
    )

    db_session.add(existing_resume)
    db_session.commit()

    # Simulate extraction failure
    with patch(
        "app.api.resumes.extract_resume_text",
        side_effect=ValueError("Unable to extract resume text")
    ):
        response = client.post(
            "/resumes/upload",
            headers={
                "Authorization": f"Bearer {test_data['candidate_token']}"
            },
            files={
                "file": (
                    "new_resume.pdf",
                    io.BytesIO(b"%PDF-1.4 fake pdf content"),
                    "application/pdf"
                )
            }
        )

    assert response.status_code == 400

    # Verify the existing resume remains active
    db_session.refresh(existing_resume)

    assert existing_resume.is_active is True

    # Verify no new resume was saved
    resumes = db_session.query(Resume).filter(
        Resume.candidate_id == test_data["candidate"].id
    ).all()

    assert len(resumes) == 1




def test_uploaded_file_is_deleted_when_database_commit_fails(
    client, test_data, db_session, tmp_path, monkeypatch
):
    from app.api import resumes as resumes_api

    # Use isolated temporary storage
    monkeypatch.setattr(resumes_api, "STORAGE_DIR", tmp_path)

    with patch(
        "app.api.resumes.extract_resume_text",
        return_value="Python developer with FastAPI experience."
    ), patch.object(
        db_session,
        "commit",
        side_effect=Exception("Database failure")
    ):
        response = client.post(
            "/resumes/upload",
            headers={
                "Authorization": f"Bearer {test_data['candidate_token']}"
            },
            files={
                "file": (
                    "resume.pdf",
                    io.BytesIO(b"%PDF-1.4 fake pdf content"),
                    "application/pdf"
                )
            }
        )

    assert response.status_code == 500
    assert response.json()["detail"] == "Resume upload failed"

    # Database should contain no uploaded resume
    resumes = db_session.query(Resume).filter(
        Resume.candidate_id == test_data["candidate"].id
    ).all()

    assert len(resumes) == 0

    # Uploaded file should have been deleted
    assert list(tmp_path.iterdir()) == []
