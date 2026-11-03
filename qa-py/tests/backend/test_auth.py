import os

from playwright.sync_api import APIRequestContext, APIResponse, expect
from src.schemas.user_schema import UserSchema

def login(api_request_context: APIRequestContext, payload: dict[str, str]) -> APIResponse:
    return api_request_context.post("/auth/login", data=payload)

def test_should_login_with_valid_credentials(api_request_context: APIRequestContext) -> None: 
    payload = {"email": os.getenv("ADMIN_EMAIL"), "password": os.getenv("ADMIN_PASSWORD") }
    response = login(api_request_context=api_request_context, payload=payload)
    expect(response).to_be_ok()

    user_schema = UserSchema.model_validate(response.json()["user"])

    expect(user_schema.email).to_equal(payload["email"])
    expect(user_schema.role).to_equal("AGENT")

def test_should_not_login_with_invalid_credentials(api_request_context: APIRequestContext) -> None: 
    response = login(api_request_context=api_request_context, payload={"email": "invalid@invalid.invalid", "password": "invalid" })
    expect(response.status).to_equal(401)

def test_should_not_login_with_empty_credentials(api_request_context: APIRequestContext) -> None: 
   response = login(api_request_context=api_request_context, payload={"email": "", "password": "" })
   expect(response.status).to_equal(401)