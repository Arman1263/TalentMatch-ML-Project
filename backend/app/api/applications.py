from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_role
from app.models import (
    Application,
    CandidateProfile,
    Job,
    RecruiterProfile,
    User
)
from app.schemas.application import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationStatusUpdate,
    RecruiterApplicationResponse
)
from app.services.application_service import apply_for_job

router = APIRouter(
    prefix="/applications",
    tags=["Applications"]
)


@router.post(
    "/",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED
)
def create_application(
    application_data: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("candidate"))
):
    candidate = db.query(CandidateProfile).filter(
        CandidateProfile.user_id == current_user.id
    ).first()

    if not candidate:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found"
        )

    return apply_for_job(
        db=db,
        candidate=candidate,
        job_id=application_data.job_id
    )


@router.get(
    "/my-applications",
    response_model=list[ApplicationResponse]
)
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("candidate"))
):
    candidate = db.query(CandidateProfile).filter(
        CandidateProfile.user_id == current_user.id
    ).first()

    if not candidate:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found"
        )

    return db.query(Application).filter(
        Application.candidate_id == candidate.id
    ).order_by(Application.applied_at.desc()).all()


@router.get(
    "/received",
    response_model=list[RecruiterApplicationResponse]
)
def get_received_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("recruiter"))
):
    recruiter = db.query(RecruiterProfile).filter(
        RecruiterProfile.user_id == current_user.id
    ).first()

    if not recruiter:
        raise HTTPException(
            status_code=404,
            detail="Recruiter profile not found"
        )

    applications = (
        db.query(
            Application,
            CandidateProfile.full_name,
            User.email
        )
        .join(Job, Application.job_id == Job.id)
        .join(
            CandidateProfile,
            Application.candidate_id == CandidateProfile.id
        )
        .join(User, CandidateProfile.user_id == User.id)
        .filter(Job.recruiter_id == recruiter.id)
        .order_by(Application.applied_at.desc())
        .all()
    )

    return [
        RecruiterApplicationResponse(
            id=application.id,
            candidate_id=application.candidate_id,
            job_id=application.job_id,
            status=application.status,
            applied_at=application.applied_at,
            candidate_name=full_name,
            candidate_email=email
        )
        for application, full_name, email in applications
    ]


@router.patch(
    "/{application_id}/status",
    response_model=ApplicationResponse
)
def update_application_status(
    application_id: UUID,
    status_data: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("recruiter"))
):
    recruiter = db.query(RecruiterProfile).filter(
        RecruiterProfile.user_id == current_user.id
    ).first()

    if not recruiter:
        raise HTTPException(
            status_code=404,
            detail="Recruiter profile not found"
        )

    application = (
        db.query(Application)
        .join(Job, Application.job_id == Job.id)
        .filter(
            Application.id == application_id,
            Job.recruiter_id == recruiter.id
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    application.status = status_data.status

    db.commit()
    db.refresh(application)

    return application