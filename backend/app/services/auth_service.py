from sqlalchemy.orm import Session

from app.models import User, CandidateProfile, RecruiterProfile
from app.core.security import hash_password, verify_password


def register_user(db: Session, data):
    existing_user = db.query(User).filter(
        User.email == data.email
    ).first()

    if existing_user:
        raise ValueError("Email already registered")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        role=data.role
    )

    db.add(user)
    db.flush()

    if data.role == "candidate":
        profile = CandidateProfile(
            user_id=user.id,
            full_name=data.full_name
        )
    else:
        profile = RecruiterProfile(
            user_id=user.id,
            full_name=data.full_name,
            company_name="Not provided"
        )

    db.add(profile)
    db.commit()
    db.refresh(user)

    return user


def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(password, user.hashed_password):
        return None

    if not user.is_active:
        return None

    return user