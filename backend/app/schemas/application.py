from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from typing import Literal


class ApplicationCreate(BaseModel):
    job_id: UUID


class ApplicationResponse(BaseModel):
    id: UUID
    candidate_id: UUID
    job_id: UUID
    status: str
    applied_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ApplicationStatusUpdate(BaseModel):
    status: Literal[
        "submitted",
        "reviewing",
        "shortlisted",
        "interview",
        "accepted",
        "rejected"
    ]


class RecruiterApplicationResponse(BaseModel):
    id: UUID
    candidate_id: UUID
    job_id: UUID
    status: str
    applied_at: datetime
    candidate_name: str
    candidate_email: str

    model_config = ConfigDict(from_attributes=True)