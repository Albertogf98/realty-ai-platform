import os

from playwright.sync_api import Page
from .base_page import BasePage

class LoginPage(BasePage):
    
    def __init__(self, page: Page) -> None:
        super().__init__(page)

        self.email_input = self.get_locator_by_id("qa-email-input")
        self.password_input = self.get_locator_by_id("qa-password-input")
        self.submit_button = self.get_locator_by_id("qa-submit-button")

    def navigate_to(self) -> None:
        super().navigate_to(url=f"{os.getenv('WEB_URL')}{os.getenv('LOGIN_PATH')}")

    def login(self, user: dict[str, str]) -> None:
        self.fill_input(self.email_input, user["email"])
        self.fill_input(self.password_input, user["password"])
        self.click(self.submit_button)
