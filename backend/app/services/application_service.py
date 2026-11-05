from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Application, CandidateProfile, Job


def apply_for_job(
    db: Session,
    candidate: CandidateProfile,
    job_id: UUID
):
    # Check whether the job exists and is active
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.is_active.is_(True)
    ).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or no longer active"
        )

    # Prevent duplicate applications
    existing_application = db.query(Application).filter(
        Application.candidate_id == candidate.id,
        Application.job_id == job.id
    ).first()

    if existing_application:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already applied for this job"
        )

    application = Application(
        candidate_id=candidate.id,
        job_id=job.id
    )

    db.add(application)
    db.commit()
    db.refresh(application)

    return application