from pydantic import BaseModel, EmailStr, Field
from typing import Literal
from uuid import UUID


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Literal["candidate", "recruiter"]
    full_name: str = Field(min_length=2, max_length=150)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    role: str
    is_active: bool

    model_config = {"from_attributes": True}