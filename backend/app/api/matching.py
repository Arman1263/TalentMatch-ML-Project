from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_role
from app.models import CandidateProfile, RecruiterProfile, User
from app.schemas.matching import (
    MatchResponse,
    MatchHistoryResponse,
    RecruiterMatchResponse,
)
from app.services.matching_service import (
    generate_match,
    get_match_history,
    get_job_candidates,
)


router = APIRouter(
    prefix="/matching",
    tags=["Matching"]
)


# NOTE: Static routes MUST be declared before parameterised routes so that
# FastAPI does not try to parse the literal path segment "my-matches" as a
# UUID job_id and return 422.


@router.get(
    "/my-matches",
    response_model=list[MatchHistoryResponse]
)
def get_my_matches(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("candidate"))
):
    candidate = db.query(CandidateProfile).filter(
        CandidateProfile.user_id == current_user.id
    ).first()

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found"
        )

    return get_match_history(
        db=db,
        candidate=candidate
    )


@router.get(
    "/job/{job_id}/candidates",
    response_model=list[RecruiterMatchResponse]
)
def get_ranked_candidates(
    job_id: UUID,
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

    return get_job_candidates(
        db=db,
        recruiter_id=recruiter.id,
        job_id=job_id
    )


@router.post(
    "/{job_id}",
    response_model=MatchResponse
)
def match_job(
    job_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("candidate"))
):
    candidate = db.query(CandidateProfile).filter(
        CandidateProfile.user_id == current_user.id
    ).first()

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found"
        )

    return generate_match(
        db=db,
        candidate=candidate,
        job_id=job_id
    )
