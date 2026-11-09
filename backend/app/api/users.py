
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models import (
    User,
    CandidateProfile,
    RecruiterProfile,
    Resume,
    Application,
    MatchResult,
    Job,
)
from app.schemas.auth import UserResponse


router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.get("/candidate/dashboard")
def candidate_dashboard(
    current_user: User = Depends(require_role("candidate")),
    db: Session = Depends(get_db),
):
    profile = (
        db.query(CandidateProfile)
        .filter(CandidateProfile.user_id == current_user.id)
        .first()
    )

    if not profile:
        return {
            "profile": None,
            "statistics": {
                "total_resumes": 0,
                "has_active_resume": False,
                "total_applications": 0,
                "total_matches": 0,
                "average_match_score": 0,
            },
        }

    total_resumes = (
        db.query(func.count(Resume.id))
        .filter(Resume.candidate_id == profile.id)
        .scalar()
    ) or 0

    active_resume = (
        db.query(Resume.id)
        .filter(
            Resume.candidate_id == profile.id,
            Resume.is_active.is_(True),
        )
        .first()
    )

    total_applications = (
        db.query(func.count(Application.id))
        .filter(Application.candidate_id == profile.id)
        .scalar()
    ) or 0

    total_matches = (
        db.query(func.count(MatchResult.id))
        .filter(MatchResult.candidate_id == profile.id)
        .scalar()
    ) or 0

    average_match_score = (
        db.query(func.avg(MatchResult.matching_score))
        .filter(MatchResult.candidate_id == profile.id)
        .scalar()
    )

    return {
        "profile": {
            "full_name": profile.full_name,
            "headline": profile.headline,
            "location": profile.location,
        },
        "statistics": {
            "total_resumes": total_resumes,
            "has_active_resume": active_resume is not None,
            "total_applications": total_applications,
            "total_matches": total_matches,
            "average_match_score": round(float(average_match_score), 2)
            if average_match_score is not None
            else 0,
        },
    }


@router.get("/recruiter/dashboard")
def recruiter_dashboard(
    current_user: User = Depends(require_role("recruiter")),
    db: Session = Depends(get_db),
):
    profile = (
        db.query(RecruiterProfile)
        .filter(RecruiterProfile.user_id == current_user.id)
        .first()
    )

    if not profile:
        return {
            "profile": None,
            "statistics": {
                "total_jobs": 0,
                "active_jobs": 0,
                "total_applications": 0,
                "total_matches": 0,
                "matched_candidates": 0,
            },
        }

    total_jobs = (
        db.query(func.count(Job.id))
        .filter(Job.recruiter_id == profile.id)
        .scalar()
    ) or 0

    active_jobs = (
        db.query(func.count(Job.id))
        .filter(
            Job.recruiter_id == profile.id,
            Job.is_active.is_(True),
        )
        .scalar()
    ) or 0

    total_applications = (
        db.query(func.count(Application.id))
        .join(Job, Application.job_id == Job.id)
        .filter(Job.recruiter_id == profile.id)
        .scalar()
    ) or 0

    total_matches = (
        db.query(func.count(MatchResult.id))
        .join(Job, MatchResult.job_id == Job.id)
        .filter(Job.recruiter_id == profile.id)
        .scalar()
    ) or 0

    matched_candidates = (
        db.query(func.count(func.distinct(MatchResult.candidate_id)))
        .join(Job, MatchResult.job_id == Job.id)
        .filter(Job.recruiter_id == profile.id)
        .scalar()
    ) or 0

    return {
        "profile": {
            "full_name": profile.full_name,
            "company_name": profile.company_name,
            "company_website": profile.company_website,
        },
        "statistics": {
            "total_jobs": total_jobs,
            "active_jobs": active_jobs,
            "total_applications": total_applications,
            "total_matches": total_matches,
            "matched_candidates": matched_candidates,
        },
    }
