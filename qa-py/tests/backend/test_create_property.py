from collections.abc import Callable
from pathlib import Path
from uuid import uuid4

import pytest
from playwright.sync_api import APIRequestContext, APIResponse, expect

from src.schemas.auth_schema import LoginResponseSchema

PROPERTY_IMAGE = (
    Path(__file__).resolve().parents[3] / "web" / "public" / "default-property.png"
)


@pytest.fixture
def create_property(
    api_request_context: APIRequestContext,
    agent_auth: LoginResponseSchema,
    request: pytest.FixtureRequest,
) -> Callable[[dict[str, str]], APIResponse]:
    created_property_ids: list[str] = []
    image = {
        "name": PROPERTY_IMAGE.name,
        "mimeType": "image/png",
        "buffer": PROPERTY_IMAGE.read_bytes(),
    }

    def _create(payload: dict[str, str]) -> APIResponse:
        response = api_request_context.post(
            "/properties",
            multipart={**payload, "images": image},
            headers={"Authorization": f"Bearer {agent_auth.access_token}"},
        )
        if response.ok:
            property_id = response.json().get("id")
            if isinstance(property_id, str):
                created_property_ids.append(property_id)
        return response

    def _cleanup() -> None:
        for property_id in reversed(created_property_ids):
            response = api_request_context.delete(
                f"/properties/{property_id}",
                headers={"Authorization": f"Bearer {agent_auth.access_token}"},
            )
            expect(response).to_be_ok()

    request.addfinalizer(_cleanup)
    return _create


def _property_payload() -> dict[str, str]:
    unique_id = uuid4().hex
    return {
        "title_es": f"Casa de prueba {unique_id}",
        "title_en": f"Test house {unique_id}",
        "description_es": "Propiedad creada por pruebas automatizadas",
        "description_en": "Property created by automated tests",
        "price": "250000",
        "type": "HOUSE",
        "status": "NEW",
        "operation": "SALE",
        "rooms": "3",
        "bathrooms": "2",
        "sqm": "120",
        "address": f"Calle de prueba {unique_id}",
        "city": "Malaga",
        "state": "Andalusia",
        "country": "Spain",
        "zipCode": "29001",
        "parking": "false",
        "garden": "true",
    }


@pytest.mark.backend
def test_should_create_property_successfully(
    create_property: Callable[[dict[str, str]], APIResponse],
    agent_auth: LoginResponseSchema,
) -> None:
    payload = _property_payload()

    response = create_property(payload)

    expect(response).to_be_ok()
    created_property = response.json()
    assert created_property["title_en"] == payload["title_en"]
    assert created_property["agentId"] == str(agent_auth.user.id)


@pytest.mark.backend
def test_should_use_authenticated_agent_when_payload_agent_does_not_exist(
    create_property: Callable[[dict[str, str]], APIResponse],
    agent_auth: LoginResponseSchema,
) -> None:
    payload = _property_payload()
    nonexistent_agent_id = str(uuid4())
    payload["agentId"] = nonexistent_agent_id

    response = create_property(payload)

    expect(response).to_be_ok()
    created_property = response.json()
    assert created_property["agentId"] != nonexistent_agent_id
    assert created_property["agentId"] == str(agent_auth.user.id)


@pytest.mark.backend
def test_should_allow_creating_the_same_property_twice(
    create_property: Callable[[dict[str, str]], APIResponse],
) -> None:
    payload = _property_payload()

    first_response = create_property(payload)
    expect(first_response).to_be_ok()
    second_response = create_property(payload)
    expect(second_response).to_be_ok()

    assert first_response.json()["id"] != second_response.json()["id"]
