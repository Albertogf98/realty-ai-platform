import os
from uuid import uuid4

import pytest
from playwright.sync_api import APIRequestContext, APIResponse, expect

from src.api.api_commons import ApiCommons
from src.schemas.create_user_schema import CreateUserResponseSchema


def create(
    api_request_context: APIRequestContext,
    payload: dict[str, str],
) -> APIResponse:
    return api_request_context.post("/auth/register", data=payload)


def test_should_create_user_with_valid_credentials(
    api_request_context: APIRequestContext,
    api_commons: ApiCommons,
    admin_access_token: str,
) -> None:
    response = create(
        api_request_context=api_request_context,
        payload={
            "email": f"test-automation-{uuid4()}@real.es",
            "password": str(uuid4()),
            "name": "Automation",
            "role": "USER",
        },
    )
    expect(response).to_be_ok()
    create_response = CreateUserResponseSchema.model_validate(response.json())
    api_commons.delete_user(str(create_response.user.id), admin_access_token)


@pytest.fixture(scope="module")
def admin_access_token(api_commons: ApiCommons) -> str:
    login_response = api_commons.login(
        {
            "email": os.getenv("ADMIN_EMAIL"),
            "password": os.getenv("ADMIN_PASSWORD"),
        }
    )
    return login_response.access_token
