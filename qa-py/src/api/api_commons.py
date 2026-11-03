from src.api.api_helper import APIHelper
from src.schemas.auth_schema import LoginResponseSchema


class ApiCommons:
    def __init__(self) -> None:
        self._api_helper = APIHelper()
        self.api = self._api_helper.api

    def login(self, user: dict[str, str]) -> LoginResponseSchema:
        response = self.api.post("/auth/login", json=user)
        response.raise_for_status()
        return LoginResponseSchema.model_validate(response.json())

    def delete_user(self, user_id: str, access_token: str) -> None:
        response = self.api.delete(
            f"/users/{user_id}",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        
        if response.status_code != 404:
            response.raise_for_status()

    def close(self) -> None:
        self._api_helper.close()
