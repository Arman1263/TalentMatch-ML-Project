
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import (
    Application,
    CandidateProfile,
    Job,
    Resume,
)
from app.services.matching_service import generate_match


def apply_for_job(
    db: Session,
    candidate: CandidateProfile,
    job_id: UUID
):
    # 1. Verify that the job exists and is active.
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.is_active.is_(True)
    ).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or no longer active"
        )

    # 2. Verify that the candidate has an active resume.
    resume = db.query(Resume).filter(
        Resume.candidate_id == candidate.id,
        Resume.is_active.is_(True)
    ).order_by(Resume.uploaded_at.desc()).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload an active resume before applying"
        )

    if not resume.extracted_text or not resume.extracted_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your active resume contains no readable text"
        )

    # 3. Prevent duplicate applications.
    existing_application = db.query(Application).filter(
        Application.candidate_id == candidate.id,
        Application.job_id == job.id
    ).first()

    if existing_application:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already applied for this job"
        )

    # 4. Create application.
    application = Application(
        candidate_id=candidate.id,
        job_id=job.id
    )

    db.add(application)

    try:
        db.commit()
        db.refresh(application)

    except IntegrityError:
        db.rollback()

        existing_application = db.query(Application).filter(
            Application.candidate_id == candidate.id,
            Application.job_id == job.id
        ).first()

        if existing_application:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You have already applied for this job"
            )

        raise

    # 5. Generate ML matching result.
    # Application remains valid even if ML matching fails.
    try:
        generate_match(
            db=db,
            candidate=candidate,
            job_id=job.id
        )
    except Exception:
        db.rollback()

        # Do not silently lose the application.
        # Matching can be retried separately.

    return application
