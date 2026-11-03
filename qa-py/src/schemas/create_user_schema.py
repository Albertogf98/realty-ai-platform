from typing import Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class CreatedUserSchema(BaseModel):
    id: UUID
    email: EmailStr
    role: Literal["USER", "AGENT", "ADMIN"]


class CreateUserResponseSchema(BaseModel):
    user: CreatedUserSchema
    access_token: str = Field(min_length=1, pattern=r"^ey")
