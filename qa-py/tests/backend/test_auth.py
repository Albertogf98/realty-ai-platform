import os

from playwright.sync_api import APIRequestContext, APIResponse
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, EmailStr

class UserSchema(BaseModel): 
    id: UUID
    email: EmailStr
    role: Literal["AGENT", "ADMIN"]

def login(api_request_context: APIRequestContext, payload: dict[str, str]) -> APIResponse:
    return api_request_context.post("/auth/login", data=payload)

def test_should_login_with_valid_credentials(api_request_context: APIRequestContext) -> None: 
    payload = {"email": os.getenv("ADMIN_EMAIL"), "password": os.getenv("ADMIN_PASSWORD") }
    response = login(api_request_context=api_request_context, payload=payload)
    assert response.ok

    user_schema = UserSchema.model_validate(response.json()["user"])

    assert user_schema.email == payload["email"]
    assert user_schema.role == "AGENT"

def test_should_not_login_with_invalid_credentials(api_request_context: APIRequestContext) -> None: 
    response = login(api_request_context=api_request_context, payload={"email": "invalid@invalid.invalid", "password": "invalid" })
    assert response.status == 401

def test_should_not_login_with_empty_credentials(api_request_context: APIRequestContext) -> None: 
   response = login(api_request_context=api_request_context, payload={"email": "", "password": "" })
   assert response.status == 401