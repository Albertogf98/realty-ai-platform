from playwright.sync_api import Page
from .base_page import BasePage

class CookieModalPage(BasePage):
      
      def __init__(self, page: Page) -> None:
            super().__init__(page)
            self.accept_button =  self.get_locator_by_id("cookies-accept")

      def accept_cookies(self) -> None: 
            self.click(self.accept_button)