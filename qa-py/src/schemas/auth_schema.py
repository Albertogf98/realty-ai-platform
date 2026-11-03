from pydantic import BaseModel

from src.schemas.user_schema import UserSchema

class LoginResponseSchema(BaseModel):
    user: UserSchema
    access_token: str
    refresh_token: str
