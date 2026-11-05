from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class JobCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=30)
    required_skills: list[str] = Field(min_length=1)
    location: str | None = None
    employment_type: str | None = None
    experience_required: int | None = Field(default=None, ge=0)


class JobUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, min_length=30)
    required_skills: list[str] | None = None
    location: str | None = None
    employment_type: str | None = None
    experience_required: int | None = Field(default=None, ge=0)
    is_active: bool | None = None


class JobResponse(BaseModel):
    id: UUID
    title: str
    company_name: str
    description: str
    required_skills: list[str] | None
    location: str | None
    employment_type: str | None
    experience_required: int | None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)