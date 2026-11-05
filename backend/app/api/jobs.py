from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_role
from app.models import User, Job
from app.schemas.job import JobCreate, JobUpdate, JobResponse

from sqlalchemy import cast
from sqlalchemy.dialects.postgresql import JSONB

router = APIRouter(prefix="/jobs", tags=["Jobs"])


def get_recruiter(current_user: User):
    if not current_user.recruiter_profile:
        raise HTTPException(404, "Recruiter profile not found")

    return current_user.recruiter_profile


# CREATE JOB
@router.post("/", response_model=JobResponse, status_code=201)
def create_job(
    data: JobCreate,
    current_user: User = Depends(require_role("recruiter")),
    db: Session = Depends(get_db)
):
    recruiter = get_recruiter(current_user)

    job = Job(
        recruiter_id=recruiter.id,
        company_name=recruiter.company_name,
        **data.model_dump()
    )

    db.add(job)
    db.commit()
    db.refresh(job)

    return job


# GET RECRUITER'S JOBS
@router.get("/my-jobs", response_model=list[JobResponse])
def get_my_jobs(
    current_user: User = Depends(require_role("recruiter")),
    db: Session = Depends(get_db)
):
    recruiter = get_recruiter(current_user)

    return (
        db.query(Job)
        .filter(Job.recruiter_id == recruiter.id)
        .order_by(Job.created_at.desc())
        .all()
    )


# UPDATE JOB
@router.patch("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: UUID,
    data: JobUpdate,
    current_user: User = Depends(require_role("recruiter")),
    db: Session = Depends(get_db)
):
    recruiter = get_recruiter(current_user)

    job = db.query(Job).filter(
        Job.id == job_id,
        Job.recruiter_id == recruiter.id
    ).first()

    if not job:
        raise HTTPException(404, "Job not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(job, field, value)

    db.commit()
    db.refresh(job)

    return job


# DEACTIVATE JOB
@router.delete("/{job_id}")
def deactivate_job(
    job_id: UUID,
    current_user: User = Depends(require_role("recruiter")),
    db: Session = Depends(get_db)
):
    recruiter = get_recruiter(current_user)

    job = db.query(Job).filter(
        Job.id == job_id,
        Job.recruiter_id == recruiter.id
    ).first()

    if not job:
        raise HTTPException(404, "Job not found")

    job.is_active = False

    db.commit()

    return {"message": "Job deactivated successfully"}


# BROWSE ACTIVE JOBS
@router.get("/", response_model=list[JobResponse])
def browse_jobs(
    search: str | None = None,
    location: str | None = None,
    employment_type: str | None = None,
    skill: str | None = None,
    experience_max: int | None = Query(default=None, ge=0),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Job).filter(Job.is_active.is_(True))

    if search:
        query = query.filter(
            Job.title.ilike(f"%{search}%")
        )

    if location:
        query = query.filter(
            Job.location.ilike(f"%{location}%")
        )

    if employment_type:
        query = query.filter(
            Job.employment_type.ilike(f"%{employment_type}%")
        )

    if skill:
        query = query.filter(
            cast(Job.required_skills, JSONB).contains([skill])
        )

    if experience_max is not None:
        query = query.filter(
            (Job.experience_required <= experience_max)
            | (Job.experience_required.is_(None))
        )

    return (
        query.order_by(Job.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


# GET SINGLE JOB
@router.get("/{job_id}", response_model=JobResponse)
def get_job(
    job_id: UUID,
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.is_active.is_(True)
    ).first()

    if not job:
        raise HTTPException(404, "Job not found")

    return job