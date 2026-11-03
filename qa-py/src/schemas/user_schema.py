from uuid import UUID
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, EmailStr

class UserSchema(BaseModel): 
    id: UUID
    email: EmailStr
    role: Literal["AGENT", "ADMIN"]
