from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_role
from app.models import User, Resume
from app.schemas.candidate import (
    CandidateProfileUpdate,
    CandidateProfileResponse,
    ResumeResponse
)

router = APIRouter(prefix="/candidates", tags=["Candidates"])


def get_candidate_profile(current_user: User):
    if not current_user.candidate_profile:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found"
        )

    return current_user.candidate_profile


@router.get("/me", response_model=CandidateProfileResponse)
def get_my_profile(
    current_user: User = Depends(require_role("candidate"))
):
    return get_candidate_profile(current_user)


@router.patch("/me", response_model=CandidateProfileResponse)
def update_my_profile(
    data: CandidateProfileUpdate,
    current_user: User = Depends(require_role("candidate")),
    db: Session = Depends(get_db)
):
    profile = get_candidate_profile(current_user)

    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)

    return profile


@router.get("/me/resumes", response_model=list[ResumeResponse])
def get_my_resumes(
    current_user: User = Depends(require_role("candidate")),
    db: Session = Depends(get_db)
):
    profile = get_candidate_profile(current_user)

    return (
        db.query(Resume)
        .filter(Resume.candidate_id == profile.id)
        .order_by(Resume.uploaded_at.desc())
        .all()
    )


@router.patch("/me/resumes/{resume_id}/activate")
def activate_resume(
    resume_id: UUID,
    current_user: User = Depends(require_role("candidate")),
    db: Session = Depends(get_db)
):
    profile = get_candidate_profile(current_user)

    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.candidate_id == profile.id
    ).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    db.query(Resume).filter(
        Resume.candidate_id == profile.id
    ).update(
        {Resume.is_active: False},
        synchronize_session=False
    )

    resume.is_active = True

    db.commit()

    return {"message": "Active resume updated successfully"}


@router.delete("/me/resumes/{resume_id}")
def delete_resume(
    resume_id: UUID,
    current_user: User = Depends(require_role("candidate")),
    db: Session = Depends(get_db)
):
    profile = get_candidate_profile(current_user)

    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.candidate_id == profile.id
    ).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    storage_dir = (
        Path(__file__).resolve().parents[2] / "storage" / "resumes"
    ).resolve()

    file_path = Path(resume.file_path).resolve()

    if file_path.parent != storage_dir:
        raise HTTPException(
            status_code=500,
            detail="Invalid resume storage path"
        )

    db.delete(resume)
    db.commit()

    if file_path.is_file():
        file_path.unlink()

    return {"message": "Resume deleted successfully"}