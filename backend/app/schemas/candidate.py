from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CandidateProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=150)
    phone: str | None = Field(default=None, max_length=20)
    location: str | None = Field(default=None, max_length=150)
    headline: str | None = Field(default=None, max_length=255)
    skills: list[str] | None = None


class CandidateProfileResponse(BaseModel):
    id: UUID
    full_name: str
    phone: str | None
    location: str | None
    headline: str | None
    skills: list[str] | None

    model_config = ConfigDict(from_attributes=True)


class ResumeResponse(BaseModel):
    id: UUID
    file_name: str
    is_active: bool
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)