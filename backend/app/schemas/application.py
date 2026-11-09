
from datetime import datetime
from uuid import UUID
from typing import Literal

from pydantic import BaseModel, ConfigDict


class ApplicationCreate(BaseModel):
    job_id: UUID


class ApplicationResponse(BaseModel):
    id: UUID
    candidate_id: UUID
    job_id: UUID
    status: str
    applied_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CandidateApplicationResponse(ApplicationResponse):
    job_title: str
    company_name: str
    job_location: str | None = None
    matching_score: float | None = None


class ApplicationStatusUpdate(BaseModel):
    status: Literal[
        "submitted",
        "reviewing",
        "shortlisted",
        "interview",
        "accepted",
        "rejected"
    ]


class RecruiterApplicationResponse(ApplicationResponse):
    candidate_name: str
    candidate_email: str
    job_title: str
    company_name: str
    matching_score: float | None = None

    model_config = ConfigDict(from_attributes=True)
