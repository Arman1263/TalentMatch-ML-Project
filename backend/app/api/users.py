from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user, require_role
from app.models import User
from app.schemas.auth import UserResponse


router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user


@router.get("/candidate/dashboard")
def candidate_dashboard(
    current_user: User = Depends(require_role("candidate"))
):
    return {
        "message": "Welcome to Candidate Dashboard",
        "user": current_user.email
    }


@router.get("/recruiter/dashboard")
def recruiter_dashboard(
    current_user: User = Depends(require_role("recruiter"))
):
    return {
        "message": "Welcome to Recruiter Dashboard",
        "user": current_user.email
    }