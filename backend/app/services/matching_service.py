from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import (
    CandidateProfile,
    Job,
    Resume,
    MatchResult,
    User
)
from app.services.ml.matching_engine import match_resume_to_job


def generate_match(
    db: Session,
    candidate: CandidateProfile,
    job_id: UUID
):
    # 1. Fetch active job
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.is_active.is_(True)
    ).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or inactive"
        )

    # 2. Fetch candidate's active resume
    resume = db.query(Resume).filter(
        Resume.candidate_id == candidate.id,
        Resume.is_active.is_(True)
    ).order_by(Resume.uploaded_at.desc()).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload an active resume before matching"
        )

    if not resume.extracted_text or not resume.extracted_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume contains no extractable text"
        )

    # 3. Run ML matching engine
    result = match_resume_to_job(
        resume_text=resume.extracted_text,
        job_description=job.description,
        required_skills=job.required_skills or []
    )

    # 4. Generate skill improvement recommendations
    recommendations = [
        f"Consider learning {skill}"
        for skill in result["missing_skills"]
    ]

    # 5. Check for an existing match result
    match_result = db.query(MatchResult).filter(
        MatchResult.candidate_id == candidate.id,
        MatchResult.job_id == job.id
    ).first()

    if match_result:
        # Update existing result
        match_result.resume_id = resume.id
        match_result.matching_score = result["matching_score"]
        match_result.matched_skills = result["matched_skills"]
        match_result.missing_skills = result["missing_skills"]
        match_result.recommendations = recommendations

    else:
        # Create new result
        match_result = MatchResult(
            candidate_id=candidate.id,
            job_id=job.id,
            resume_id=resume.id,
            matching_score=result["matching_score"],
            matched_skills=result["matched_skills"],
            missing_skills=result["missing_skills"],
            recommendations=recommendations
        )

        db.add(match_result)

    # 6. Save to database
    try:
        db.commit()
        db.refresh(match_result)
    except Exception:
        db.rollback()
        raise

    return {
        "match_id": match_result.id,
        "job_id": job.id,
        "job_title": job.title,
        "company_name": job.company_name,
        "matching_score": float(match_result.matching_score),
        "tfidf_score": result["tfidf_score"],
        "semantic_score": result["semantic_score"],
        "skills_score": result["skills_score"],
        "matched_skills": match_result.matched_skills,
        "missing_skills": match_result.missing_skills,
        "recommendations": match_result.recommendations
    }


def get_match_history(
    db: Session,
    candidate: CandidateProfile
):
    matches = (
        db.query(MatchResult, Job)
        .join(Job, MatchResult.job_id == Job.id)
        .filter(MatchResult.candidate_id == candidate.id)
        .order_by(MatchResult.created_at.desc())
        .all()
    )

    return [
        {
            "match_id": match.id,
            "job_id": job.id,
            "job_title": job.title,
            "company_name": job.company_name,
            "matching_score": float(match.matching_score),
            "matched_skills": match.matched_skills or [],
            "missing_skills": match.missing_skills or [],
            "recommendations": match.recommendations or [],
            "created_at": match.created_at,
        }
        for match, job in matches
    ]


def get_job_candidates(
    db: Session,
    recruiter_id: UUID,
    job_id: UUID
):
    # 1. Verify job ownership
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.recruiter_id == recruiter_id
    ).first()

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found or you don't have permission"
        )

    # 2. Fetch candidates ranked by matching score
    results = (
        db.query(MatchResult, CandidateProfile, User)
        .join(
            CandidateProfile,
            MatchResult.candidate_id == CandidateProfile.id
        )
        .join(
            User,
            CandidateProfile.user_id == User.id
        )
        .filter(MatchResult.job_id == job_id)
        .order_by(MatchResult.matching_score.desc())
        .all()
    )

    # 3. Format response
    return [
        {
            "match_id": match.id,
            "candidate_id": candidate.id,
            "candidate_name": candidate.full_name,
            "candidate_email": user.email,
            "matching_score": float(match.matching_score),
            "matched_skills": match.matched_skills or [],
            "missing_skills": match.missing_skills or [],
            "created_at": match.created_at
        }
        for match, candidate, user in results
    ]