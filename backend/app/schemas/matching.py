from uuid import UUID

from pydantic import BaseModel, ConfigDict

from datetime import datetime


class MatchResponse(BaseModel):
    match_id: UUID
    job_id: UUID
    job_title: str
    company_name: str

    matching_score: float
    tfidf_score: float
    semantic_score: float
    skills_score: float

    matched_skills: list[str]
    missing_skills: list[str]
    recommendations: list[str]

    model_config = ConfigDict(from_attributes=True)


class MatchHistoryResponse(BaseModel):
    match_id: UUID
    job_id: UUID
    job_title: str
    company_name: str
    matching_score: float
    matched_skills: list[str]
    missing_skills: list[str]
    recommendations: list[str]
    created_at: datetime


class RecruiterMatchResponse(BaseModel):
    match_id: UUID
    candidate_id: UUID
    candidate_name: str
    candidate_email: str
    matching_score: float
    matched_skills: list[str]
    missing_skills: list[str]
    created_at: datetime